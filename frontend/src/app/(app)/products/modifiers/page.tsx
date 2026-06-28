"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { TableActionButton } from "@/components/shared/table-action-button";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useModifiers,
  useCreateModifierGroup,
  useUpdateModifierGroup,
  useDeleteModifierGroup,
  useCreateModifierOption,
  useUpdateModifierOption,
  useDeleteModifierOption,
} from "@/hooks/domains/useModifierQueries";
import { useIngredients, useProducts } from "@/hooks/domains/useProductQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ModifierGroup, ModifierOption, Ingredient, Product } from "@/types/api";
import { getErrorMessage } from "@/lib/errors";
import { formatHubListCountWithFetching } from "@/lib/format-hub-list-count";
import { formatBaht, toNumber } from "@/lib/money";
import {
  buildModifierCategoryOptions,
  countModifierOptions,
  matchesModifierCategoryFilter,
  matchesModifierHighlightFilter,
  matchesModifierSearch,
  modifierGroupHasSwap,
  modifierGroupIsEmpty,
  type ModifierCategoryFilter,
  type ModifierHighlightFilter,
} from "@/lib/modifier-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  formFieldInsetClassName,
  formSelectContentClassName,
  hubCtaClassName,
  hubLoadingSpinnerClassName,
  metricValueClassName,
  modifierGroupPanelClassName,
  productsCategoryBadgeClassName,
  productsDialogContentClassName,
  productsSectionPanelClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = "__all__";
const EMPTY_INGREDIENT = "__none__";

function IngredientSelect({
  value,
  onChange,
  placeholder,
  allowEmpty = true,
  id,
}: {
  value: number | "";
  onChange: (value: number | "") => void;
  placeholder: string;
  allowEmpty?: boolean;
  id?: string;
}) {
  const { data: ingredients = [] } = useIngredients();
  const selectValue = value === "" ? EMPTY_INGREDIENT : String(value);

  return (
    <Select
      value={selectValue}
      onValueChange={(v) =>
        onChange(v === EMPTY_INGREDIENT || v == null ? "" : Number(v))
      }
    >
      <SelectTrigger id={id} className={formFieldInsetClassName("w-full")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={formSelectContentClassName()}>
        {allowEmpty && (
          <SelectItem value={EMPTY_INGREDIENT}>{placeholder}</SelectItem>
        )}
        {ingredients.map((ing: Ingredient) => (
          <SelectItem key={ing.id} value={String(ing.id)}>
            {ing.name} ({ing.unit})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ModifiersPage() {
  const {
    data: groups = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useModifiers();
  const { data: products = [] } = useProducts();
  const createGroup = useCreateModifierGroup();
  const updateGroup = useUpdateModifierGroup();
  const deleteGroup = useDeleteModifierGroup();
  const createOption = useCreateModifierOption();
  const updateOption = useUpdateModifierOption();
  const deleteOption = useDeleteModifierOption();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [categoryFilter, setCategoryFilter] = useState<ModifierCategoryFilter>("ALL");
  const [highlightFilter, setHighlightFilter] = useState<ModifierHighlightFilter>("ALL");

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [editingOption, setEditingOption] = useState<ModifierOption | null>(null);
  const [optionGroupId, setOptionGroupId] = useState<number | null>(null);

  const [groupName, setGroupName] = useState("");
  const [groupCategory, setGroupCategory] = useState("Coffee");
  const [groupSortOrder, setGroupSortOrder] = useState("0");
  const [groupSwapIngredientId, setGroupSwapIngredientId] = useState<number | "">("");

  const [optionName, setOptionName] = useState("");
  const [optionPriceDelta, setOptionPriceDelta] = useState("0");
  const [optionSortOrder, setOptionSortOrder] = useState("0");
  const [optionIsDefault, setOptionIsDefault] = useState(false);
  const [optionSwapToId, setOptionSwapToId] = useState<number | "">("");

  type PendingDelete =
    | { type: "group"; item: ModifierGroup }
    | { type: "option"; item: ModifierOption };
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const productCategories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p: Product) => p.category)
            .filter(Boolean) as string[],
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const formCategoryOptions = useMemo(
    () => buildModifierCategoryOptions(groups, productCategories),
    [groups, productCategories],
  );

  const toolbarCategories = useMemo(
    () => buildModifierCategoryOptions(groups, productCategories),
    [groups, productCategories],
  );

  const summary = useMemo(() => {
    let emptyGroups = 0;
    let withSwap = 0;
    for (const group of groups) {
      if (modifierGroupIsEmpty(group)) emptyGroups += 1;
      if (modifierGroupHasSwap(group)) withSwap += 1;
    }
    return {
      totalGroups: groups.length,
      totalOptions: countModifierOptions(groups),
      emptyGroups,
      withSwap,
    };
  }, [groups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((group: ModifierGroup) => {
      const matchesSearch = matchesModifierSearch(group, debouncedSearch);
      const matchesCategory = matchesModifierCategoryFilter(group, categoryFilter);
      const matchesHighlight = matchesModifierHighlightFilter(group, highlightFilter);
      return matchesSearch && matchesCategory && matchesHighlight;
    });
  }, [groups, debouncedSearch, categoryFilter, highlightFilter]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    categoryFilter !== "ALL" ||
    highlightFilter !== "ALL";

  const isSavingGroup = createGroup.isPending || updateGroup.isPending;
  const isSavingOption = createOption.isPending || updateOption.isPending;
  const isDeleting = deleteGroup.isPending || deleteOption.isPending;

  const resetGroupForm = useCallback(() => {
    setEditingGroup(null);
    setGroupName("");
    setGroupCategory(formCategoryOptions[0] ?? "Coffee");
    setGroupSortOrder("0");
    setGroupSwapIngredientId("");
  }, [formCategoryOptions]);

  const resetOptionForm = useCallback(() => {
    setEditingOption(null);
    setOptionGroupId(null);
    setOptionName("");
    setOptionPriceDelta("0");
    setOptionSortOrder("0");
    setOptionIsDefault(false);
    setOptionSwapToId("");
  }, []);

  const openCreateGroup = useCallback(() => {
    resetGroupForm();
    setGroupDialogOpen(true);
  }, [resetGroupForm]);

  const openEditGroup = useCallback((group: ModifierGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupCategory(group.category ?? ALL_CATEGORIES);
    setGroupSortOrder(String(group.sortOrder));
    setGroupSwapIngredientId(group.swapIngredientId ?? "");
    setGroupDialogOpen(true);
  }, []);

  const openCreateOption = useCallback(
    (groupId: number) => {
      resetOptionForm();
      setOptionGroupId(groupId);
      setOptionDialogOpen(true);
    },
    [resetOptionForm],
  );

  const openEditOption = useCallback((option: ModifierOption) => {
    setEditingOption(option);
    setOptionGroupId(option.groupId);
    setOptionName(option.name);
    setOptionPriceDelta(String(toNumber(option.priceDelta)));
    setOptionSortOrder(String(option.sortOrder));
    setOptionIsDefault(option.isDefault);
    setOptionSwapToId(option.swapToIngredientId ?? "");
    setOptionDialogOpen(true);
  }, []);

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    const categoryValue =
      groupCategory === ALL_CATEGORIES
        ? editingGroup
          ? null
          : undefined
        : groupCategory || undefined;
    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({
          id: editingGroup.id,
          name: groupName.trim(),
          category: categoryValue,
          sortOrder: Number(groupSortOrder) || 0,
          swapIngredientId:
            groupSwapIngredientId === "" ? null : Number(groupSwapIngredientId),
        });
        toast.success("Modifier group updated");
      } else {
        await createGroup.mutateAsync({
          name: groupName.trim(),
          category: categoryValue === null ? undefined : categoryValue,
          sortOrder: Number(groupSortOrder) || 0,
          swapIngredientId:
            groupSwapIngredientId === "" ? undefined : Number(groupSwapIngredientId),
        });
        toast.success("Modifier group created");
      }
      setGroupDialogOpen(false);
      resetGroupForm();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save group"));
    }
  };

  const handleDeleteGroup = async (group: ModifierGroup) => {
    try {
      await deleteGroup.mutateAsync(group.id);
      toast.success("Modifier group deleted");
      setPendingDelete(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete group"));
    }
  };

  const handleSaveOption = async () => {
    if (!optionName.trim() || !optionGroupId) {
      toast.error("Option name is required");
      return;
    }
    try {
      const payload = {
        name: optionName.trim(),
        priceDelta: Number(optionPriceDelta) || 0,
        sortOrder: Number(optionSortOrder) || 0,
        isDefault: optionIsDefault,
        swapToIngredientId:
          optionSwapToId === "" ? undefined : Number(optionSwapToId),
      };
      if (editingOption) {
        await updateOption.mutateAsync({
          id: editingOption.id,
          ...payload,
          swapToIngredientId:
            optionSwapToId === "" ? null : Number(optionSwapToId),
        });
        toast.success("Option updated");
      } else {
        await createOption.mutateAsync({ groupId: optionGroupId, ...payload });
        toast.success("Option created");
      }
      setOptionDialogOpen(false);
      resetOptionForm();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save option"));
    }
  };

  const handleDeleteOption = async (option: ModifierOption) => {
    try {
      await deleteOption.mutateAsync(option.id);
      toast.success("Option deleted");
      setPendingDelete(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete option"));
    }
  };

  const makeOptionColumns = useCallback(
    (group: ModifierGroup): ColumnsType<ModifierOption> => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (name: string) => (
          <span className={cn("font-medium", text.primary)}>{name}</span>
        ),
      },
      {
        title: "Price +",
        key: "price",
        render: (_: unknown, record: ModifierOption) => (
          <span
            className={cn(
              "font-bold tabular-nums",
              metricValueClassName("emerald"),
            )}
          >
            {formatBaht(toNumber(record.priceDelta))}
          </span>
        ),
      },
      {
        title: "Default",
        dataIndex: "isDefault",
        key: "default",
        responsive: ["md"],
        render: (v: boolean) =>
          v ? (
            <StatusBadge tone="success">Yes</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">No</StatusBadge>
          ),
      },
      {
        title: "Swap to",
        key: "swap",
        responsive: ["lg"],
        render: (_: unknown, record: ModifierOption) =>
          record.swapToIngredient?.name ? (
            <StatusBadge tone="success">{record.swapToIngredient.name}</StatusBadge>
          ) : (
            <span className={text.muted}>—</span>
          ),
      },
      {
        title: "Sort",
        dataIndex: "sortOrder",
        key: "sort",
        responsive: ["lg"],
        render: (sortOrder: number) => (
          <span className={tableCellMutedClassName()}>{sortOrder}</span>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 96,
        align: "right" as const,
        render: (_: unknown, record: ModifierOption) => (
          <div className="flex items-center justify-end gap-1">
            <TableActionButton
              icon={Pencil}
              label={`Edit ${record.name} in ${group.name}`}
              iconOnly
              tone="purple"
              onClick={() => openEditOption(record)}
            />
            <TableActionButton
              icon={Trash2}
              label={`Delete ${record.name}`}
              iconOnly
              destructive
              onClick={() => setPendingDelete({ type: "option", item: record })}
            />
          </div>
        ),
      },
    ],
    [openEditOption],
  );

  const groupActionButtonClass =
    "min-h-[44px] font-medium";

  return (
    <>
      <HubPageHeader
        hideTitle
        icon={SlidersHorizontal}
        accentHub="products"
        actions={
          <>
            <ButtonLink href="/pos/terminal" variant="outline" className="font-medium">
              <Monitor className="w-4 h-4 mr-2" aria-hidden />
              POS Terminal
            </ButtonLink>
            <Button
              onClick={openCreateGroup}
              className={hubCtaClassName("products", "font-bold")}
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden />
              New Group
            </Button>
          </>
        }
      />

      <HubListPage className={productsSectionPanelClassName()}>
        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load modifier groups") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search groups and options…"
          showReset={hasActiveFilters}
          onReset={() => {
            setSearch("");
            setCategoryFilter("ALL");
            setHighlightFilter("ALL");
          }}
          filters={
            <>
              <ListFilterSelect
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value as ModifierCategoryFilter)}
                ariaLabel="Filter by menu category"
                widthClassName="w-full sm:w-[200px]"
                options={[
                  { value: "ALL", label: "All categories" },
                  ...toolbarCategories.map((cat) => ({ value: cat, label: cat })),
                ]}
              />
              <ListFilterSelect
                value={highlightFilter}
                onValueChange={(value) => setHighlightFilter(value as ModifierHighlightFilter)}
                ariaLabel="Filter by group type"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All groups" },
                  { value: "empty", label: "Empty groups" },
                  { value: "with-swap", label: "With swap" },
                ]}
              />
            </>
          }
        />

        <HubListPage.Count
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredGroups.length}
          totalCount={summary.totalGroups}
          itemLabel="group"
          emptyLabel="No modifier groups yet"
        >
          {!hasActiveFilters && summary.totalGroups > 0
            ? formatHubListCountWithFetching(
                `${summary.totalGroups} group${summary.totalGroups === 1 ? "" : "s"} · ${summary.totalOptions} option${summary.totalOptions === 1 ? "" : "s"}`,
                isFetching,
                isLoading,
              )
            : undefined}
        </HubListPage.Count>

        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className={hubLoadingSpinnerClassName("w-8 h-8 animate-spin motion-reduce:animate-none")}
              aria-hidden
            />
            <span className={text.muted}>Loading modifier groups…</span>
          </div>
        ) : !isError && filteredGroups.length === 0 ? (
          <p className={cn("text-sm py-8 text-center", text.muted)}>
            {hasActiveFilters
              ? "No modifier groups match your filters."
              : "No modifier groups yet. Create one to customize POS orders."}
          </p>
        ) : (
          !isError &&
          filteredGroups.map((group: ModifierGroup) => (
            <div key={group.id} className={modifierGroupPanelClassName()}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className={cn("text-lg font-bold", text.primary)}>
                    {group.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {group.category ? (
                      <span className={productsCategoryBadgeClassName()}>
                        {group.category}
                      </span>
                    ) : (
                      <span className={productsCategoryBadgeClassName()}>
                        All categories
                      </span>
                    )}
                    <span className={productsCategoryBadgeClassName()}>
                      Order: {group.sortOrder}
                    </span>
                    {group.swapIngredient && (
                      <StatusBadge tone="success">
                        Swaps: {group.swapIngredient.name}
                      </StatusBadge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={groupActionButtonClass}
                    onClick={() => openEditGroup(group)}
                  >
                    <Pencil className="w-4 h-4 mr-1" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={groupActionButtonClass}
                    onClick={() => openCreateOption(group.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" aria-hidden />
                    Option
                  </Button>
                  <TableActionButton
                    icon={Trash2}
                    label={`Delete ${group.name}`}
                    iconOnly
                    variant="outline"
                    destructive
                    onClick={() => setPendingDelete({ type: "group", item: group })}
                  />
                </div>
              </div>

              <DataTable
                rowKey="id"
                dataSource={group.options}
                pagination={false}
                hideBorders
                emptyDescription="No options in this group yet."
                columns={makeOptionColumns(group)}
              />
            </div>
          ))
        )}
      </HubListPage>

      <Dialog
        open={groupDialogOpen}
        onOpenChange={(open) => {
          setGroupDialogOpen(open);
          if (!open) resetGroupForm();
        }}
      >
        <DialogContent className={productsDialogContentClassName()}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingGroup ? "Edit Modifier Group" : "New Modifier Group"}
            </DialogTitle>
            <DialogDescription>
              Groups appear on POS for matching product categories. Set swap
              ingredient for milk-type style replacements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="modifier-group-name" className={text.secondary}>
                Name
              </Label>
              <Input
                id="modifier-group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className={formFieldInsetClassName()}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modifier-group-category" className={text.secondary}>
                  Category filter
                </Label>
                <Select
                  value={groupCategory || ALL_CATEGORIES}
                  onValueChange={(v) => v != null && setGroupCategory(v)}
                >
                  <SelectTrigger
                    id="modifier-group-category"
                    className={formFieldInsetClassName("w-full")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={formSelectContentClassName()}>
                    <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                    {formCategoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modifier-group-sort-order" className={text.secondary}>
                  Sort order
                </Label>
                <Input
                  id="modifier-group-sort-order"
                  type="number"
                  min={0}
                  value={groupSortOrder}
                  onChange={(e) => setGroupSortOrder(e.target.value)}
                  className={formFieldInsetClassName()}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modifier-group-swap-ingredient" className={text.secondary}>
                Menu recipe ingredient to swap (optional)
              </Label>
              <IngredientSelect
                id="modifier-group-swap-ingredient"
                value={groupSwapIngredientId}
                onChange={setGroupSwapIngredientId}
                placeholder="No ingredient swap"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => void handleSaveGroup()}
              disabled={isSavingGroup}
              className={cn("w-full", hubCtaClassName("products", "font-bold"))}
            >
              {isSavingGroup && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
              )}
              {editingGroup ? "Save changes" : "Create group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={optionDialogOpen}
        onOpenChange={(open) => {
          setOptionDialogOpen(open);
          if (!open) resetOptionForm();
        }}
      >
        <DialogContent className={productsDialogContentClassName()}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingOption ? "Edit Option" : "New Option"}
            </DialogTitle>
            <DialogDescription>
              Set swap-to ingredient when this option replaces the group swap
              target (e.g. Oat → Oat Milk).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="modifier-option-name" className={text.secondary}>
                Name
              </Label>
              <Input
                id="modifier-option-name"
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
                className={formFieldInsetClassName()}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modifier-option-price-delta" className={text.secondary}>
                  Price delta (฿)
                </Label>
                <Input
                  id="modifier-option-price-delta"
                  type="number"
                  min={0}
                  value={optionPriceDelta}
                  onChange={(e) => setOptionPriceDelta(e.target.value)}
                  className={formFieldInsetClassName()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modifier-option-sort-order" className={text.secondary}>
                  Sort order
                </Label>
                <Input
                  id="modifier-option-sort-order"
                  type="number"
                  min={0}
                  value={optionSortOrder}
                  onChange={(e) => setOptionSortOrder(e.target.value)}
                  className={formFieldInsetClassName()}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--form-line-border)] bg-[var(--form-line-bg)] px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="modifier-option-is-default" className={text.secondary}>
                  Default selection
                </Label>
                <p className={cn("text-xs", text.muted)}>
                  Pre-selected when the group opens on POS
                </p>
              </div>
              <Switch
                id="modifier-option-is-default"
                checked={optionIsDefault}
                onCheckedChange={setOptionIsDefault}
                aria-label="Default selection"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modifier-option-swap-ingredient" className={text.secondary}>
                Swap to ingredient (optional)
              </Label>
              <IngredientSelect
                id="modifier-option-swap-ingredient"
                value={optionSwapToId}
                onChange={setOptionSwapToId}
                placeholder="Keep recipe ingredient"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => void handleSaveOption()}
              disabled={isSavingOption}
              className={cn("w-full", hubCtaClassName("products", "font-bold"))}
            >
              {isSavingOption && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
              )}
              {editingOption ? "Save option" : "Add option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={
          pendingDelete?.type === "group"
            ? `Delete "${pendingDelete.item.name}"?`
            : `Delete option "${pendingDelete?.type === "option" ? pendingDelete.item.name : ""}"?`
        }
        description={
          pendingDelete?.type === "group"
            ? "This will remove the group and all of its options."
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={async () => {
          if (!pendingDelete) return;
          if (pendingDelete.type === "group") {
            await handleDeleteGroup(pendingDelete.item);
          } else {
            await handleDeleteOption(pendingDelete.item);
          }
        }}
      />
    </>
  );
}
