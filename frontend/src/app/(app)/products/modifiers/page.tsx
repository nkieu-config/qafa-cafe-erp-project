"use client";

import { useState } from "react";
import { SlidersHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { Popconfirm } from "antd";
import { HubCard } from "@/components/shared/hub-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  useModifiers,
  useCreateModifierGroup,
  useUpdateModifierGroup,
  useDeleteModifierGroup,
  useCreateModifierOption,
  useUpdateModifierOption,
  useDeleteModifierOption,
} from "@/hooks/domains/useModifierQueries";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import type { ModifierGroup, ModifierOption, Ingredient } from "@/types/api";
import { getErrorMessage } from "@/lib/errors";
import { formatBaht } from "@/lib/money";
import { toNumber } from "@/lib/money";

const CATEGORY_OPTIONS = ["Coffee", "Beverage", "Food", ""];

function IngredientSelect({
  value,
  onChange,
  placeholder,
  allowEmpty = true,
}: {
  value: number | "";
  onChange: (value: number | "") => void;
  placeholder: string;
  allowEmpty?: boolean;
}) {
  const { data: ingredients = [] } = useIngredients();
  return (
    <select
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      value={value === "" ? "" : String(value)}
      onChange={(e) =>
        onChange(e.target.value ? Number(e.target.value) : "")
      }
    >
      {allowEmpty && <option value="">{placeholder}</option>}
      {ingredients.map((ing: Ingredient) => (
        <option key={ing.id} value={ing.id}>
          {ing.name} ({ing.unit})
        </option>
      ))}
    </select>
  );
}

export default function ModifiersPage() {
  const { data: groups = [], isLoading } = useModifiers();
  const createGroup = useCreateModifierGroup();
  const updateGroup = useUpdateModifierGroup();
  const deleteGroup = useDeleteModifierGroup();
  const createOption = useCreateModifierOption();
  const updateOption = useUpdateModifierOption();
  const deleteOption = useDeleteModifierOption();

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

  const resetGroupForm = () => {
    setEditingGroup(null);
    setGroupName("");
    setGroupCategory("Coffee");
    setGroupSortOrder("0");
    setGroupSwapIngredientId("");
  };

  const resetOptionForm = () => {
    setEditingOption(null);
    setOptionGroupId(null);
    setOptionName("");
    setOptionPriceDelta("0");
    setOptionSortOrder("0");
    setOptionIsDefault(false);
    setOptionSwapToId("");
  };

  const openCreateGroup = () => {
    resetGroupForm();
    setGroupDialogOpen(true);
  };

  const openEditGroup = (group: ModifierGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupCategory(group.category ?? "");
    setGroupSortOrder(String(group.sortOrder));
    setGroupSwapIngredientId(group.swapIngredientId ?? "");
    setGroupDialogOpen(true);
  };

  const openCreateOption = (groupId: number) => {
    resetOptionForm();
    setOptionGroupId(groupId);
    setOptionDialogOpen(true);
  };

  const openEditOption = (option: ModifierOption) => {
    setEditingOption(option);
    setOptionGroupId(option.groupId);
    setOptionName(option.name);
    setOptionPriceDelta(String(toNumber(option.priceDelta)));
    setOptionSortOrder(String(option.sortOrder));
    setOptionIsDefault(option.isDefault);
    setOptionSwapToId(option.swapToIngredientId ?? "");
    setOptionDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    try {
      const payload = {
        name: groupName.trim(),
        category: groupCategory || undefined,
        sortOrder: Number(groupSortOrder) || 0,
        swapIngredientId:
          groupSwapIngredientId === "" ? undefined : Number(groupSwapIngredientId),
      };
      if (editingGroup) {
        await updateGroup.mutateAsync({ id: editingGroup.id, ...payload });
        toast.success("Modifier group updated");
      } else {
        await createGroup.mutateAsync(payload);
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete option"));
    }
  };

  return (
    <>
      <HubCard
        title="Modifier Groups"
        icon={SlidersHorizontal}
        description="Configure POS modifiers, price adjustments, and ingredient swaps (e.g. oat milk)."
        actions={
          <Button onClick={openCreateGroup} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" /> New Group
          </Button>
        }
      >

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading modifiers…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No modifier groups yet. Create one to customize POS orders.</p>
      ) : (
        groups.map((group: ModifierGroup) => (
          <div
            key={group.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-5 space-y-4 mb-4 last:mb-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {group.name}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {group.category && (
                    <Badge variant="secondary">{group.category}</Badge>
                  )}
                  <Badge variant="outline">Order: {group.sortOrder}</Badge>
                  {group.swapIngredient && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Swaps: {group.swapIngredient.name}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditGroup(group)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCreateOption(group.id)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Option
                </Button>
                <Popconfirm
                  title={`Delete "${group.name}" and all its options?`}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => void handleDeleteGroup(group)}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Popconfirm>
              </div>
            </div>

            <DataTable
              rowKey="id"
              dataSource={group.options}
              pagination={false}
              hideBorders
              emptyDescription="No options in this group yet."
              columns={[
                { title: "Name", dataIndex: "name", key: "name" },
                {
                  title: "Price +",
                  key: "price",
                  render: (_: unknown, record: ModifierOption) =>
                    formatBaht(toNumber(record.priceDelta)),
                },
                {
                  title: "Default",
                  dataIndex: "isDefault",
                  key: "default",
                  render: (v: boolean) => (v ? "Yes" : "—"),
                },
                {
                  title: "Swap to",
                  key: "swap",
                  render: (_: unknown, record: ModifierOption) =>
                    record.swapToIngredient?.name ?? "—",
                },
                { title: "Sort", dataIndex: "sortOrder", key: "sort" },
                {
                  title: "",
                  key: "actions",
                  render: (_: unknown, record: ModifierOption) => (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditOption(record)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Popconfirm
                        title={`Delete option "${record.name}"?`}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => void handleDeleteOption(record)}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Popconfirm>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        ))
      )}
      </HubCard>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Edit Modifier Group" : "New Modifier Group"}
            </DialogTitle>
            <DialogDescription>
              Groups appear on POS for matching product categories. Set swap
              ingredient for milk-type style replacements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category filter</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={groupCategory}
                  onChange={(e) => setGroupCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c || "all"} value={c}>
                      {c || "All categories"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  min={0}
                  value={groupSortOrder}
                  onChange={(e) => setGroupSortOrder(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recipe ingredient to swap (optional)</Label>
              <IngredientSelect
                value={groupSwapIngredientId}
                onChange={setGroupSwapIngredientId}
                placeholder="No ingredient swap"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void handleSaveGroup()} className="w-full">
              {editingGroup ? "Save changes" : "Create group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOption ? "Edit Option" : "New Option"}
            </DialogTitle>
            <DialogDescription>
              Set swap-to ingredient when this option replaces the group swap
              target (e.g. Oat → Oat Milk).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={optionName} onChange={(e) => setOptionName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price delta (฿)</Label>
                <Input
                  type="number"
                  min={0}
                  value={optionPriceDelta}
                  onChange={(e) => setOptionPriceDelta(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  min={0}
                  value={optionSortOrder}
                  onChange={(e) => setOptionSortOrder(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={optionIsDefault}
                onChange={(e) => setOptionIsDefault(e.target.checked)}
              />
              Default selection
            </label>
            <div className="space-y-2">
              <Label>Swap to ingredient (optional)</Label>
              <IngredientSelect
                value={optionSwapToId}
                onChange={setOptionSwapToId}
                placeholder="Keep recipe ingredient"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void handleSaveOption()} className="w-full">
              {editingOption ? "Save option" : "Add option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
