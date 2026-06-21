"use client"

import { useState, useMemo } from "react"
import { useProductionBOMs, useIngredients, useCreateProductionBOM } from "@/hooks/useQueries"
import { Button, Form, Select, InputNumber, Space, Progress, Tag } from "antd"
import { FormModal } from "@/components/shared/form-modal"
import { ListTree, Plus, MinusCircle, Save, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { AnimatedPage } from "@/components/animated-page"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"

export default function BOMPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { data: bomsData = [], isLoading: loadingBoms } = useProductionBOMs();
  const { data: ingredientsData = [], isLoading: loadingIng } = useIngredients();

  const loading = loadingBoms || loadingIng;
  const ingredients = ingredientsData;

  const bomsGrouped = useMemo(() => {
    // Group BOMs by targetIngredientId
    const grouped = bomsData.reduce((acc: any, bom: any) => {
      const targetId = bom.targetIngredientId;
      if (!acc[targetId]) {
        acc[targetId] = {
          id: `TARGET_${targetId}`,
          targetName: bom.targetIngredient.name,
          targetUnit: bom.targetIngredient.unit,
          isGroup: true,
          children: []
        };
      }
      acc[targetId].children.push({
        id: bom.id,
        rawIngredientId: bom.rawIngredientId,
        rawName: bom.rawIngredient.name,
        rawUnit: bom.rawIngredient.unit,
        quantityNeeded: bom.quantityNeeded,
        costPerUnit: bom.rawIngredient.costPerUnit,
        totalCost: bom.quantityNeeded * bom.rawIngredient.costPerUnit
      });
      return acc;
    }, {});

    return Object.values(grouped);
  }, [bomsData]);

  const createMutation = useCreateProductionBOM();

  const handleCreate = async (values: any) => {
    try {
      const promises = values.rawIngredients.map((item: any) => 
        createMutation.mutateAsync({
          targetIngredientId: values.targetIngredientId,
          rawIngredientId: item.rawIngredientId,
          quantityNeeded: item.quantityNeeded
        })
      );
      await Promise.all(promises);
      toast.success("BOM created successfully");
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: unknown) {
      if (error instanceof Error) toast.error("Failed to create BOM");
    }
  }

  const columns = [
    {
      title: 'Target / Raw Ingredient',
      dataIndex: 'targetName',
      key: 'name',
      render: (_: any, record: any) => {
        if (record.isGroup) {
          return <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{record.targetName}</span>
        }
        return <span className="text-slate-600 dark:text-slate-400 pl-4">{record.rawName}</span>
      }
    },
    {
      title: 'Quantity Needed',
      key: 'quantity',
      render: (_: any, record: any) => {
        if (record.isGroup) return <span className="text-slate-400 text-xs uppercase tracking-wider">Per 1 {record.targetUnit}</span>;
        return <span className="font-mono font-medium">{record.quantityNeeded} {record.rawUnit}</span>
      }
    },
    {
      title: 'Est. Cost',
      key: 'cost',
      render: (_: any, record: any) => {
        if (record.isGroup) {
          const total = record.children.reduce((sum: number, c: any) => sum + c.totalCost, 0);
          return <span className="font-black text-rose-600 dark:text-rose-400">฿{total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
        }
        return <span className="text-slate-500 font-mono">฿{record.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
      }
    },
    {
      title: 'Food Cost % (Target < 30%)',
      key: 'foodcost',
      render: (_: any, record: any) => {
        if (record.isGroup) {
          const totalRawCost = record.children.reduce((sum: number, c: any) => sum + c.totalCost, 0);
          // Mock an estimated sale price for demonstration purposes (e.g. 150 THB, or 80 THB)
          const mockSalePrice = totalRawCost > 30 ? 120 : 60; 
          const foodCostPercent = (totalRawCost / mockSalePrice) * 100;
          const isWarning = foodCostPercent > 30;

          return (
            <div className="flex items-center gap-4">
              <div className="w-24">
                <Progress 
                  percent={parseFloat(foodCostPercent.toFixed(1))} 
                  size="small"
                  strokeColor={isWarning ? '#ef4444' : '#10b981'} // Red if > 30%, Green otherwise
                  format={(percent) => (
                    <span className={`font-black text-xs ${isWarning ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {percent}%
                    </span>
                  )}
                />
              </div>
              {isWarning && (
                <Tag color="error" className="flex items-center gap-1 font-bold rounded-lg border-rose-200">
                  <AlertTriangle className="w-3 h-3" /> High Cost
                </Tag>
              )}
            </div>
          )
        }
        return null;
      }
    }
  ]

  return (
    <AnimatedPage className="space-y-6 w-full">
      <PageHeader 
        title="Bill of Materials (Recipes)"
        icon={ListTree}
        description="Manage recipes and monitor food cost efficiency."
        actions={
          <Button 
            type="primary" 
            className="bg-orange-500 hover:bg-orange-600 shadow-sm font-bold flex items-center gap-2"
            onClick={() => setIsModalVisible(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create / Update BOM
          </Button>
        }
      />

      <DataTable 
        columns={columns} 
        dataSource={bomsGrouped} 
        rowKey="id"
        loading={loading}
        pagination={false}
        defaultExpandAllRows={true}
      />

      <FormModal
        title="Create / Update BOM"
        isOpen={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-4">
          <Form.Item
            name="targetIngredientId"
            label={<span className="font-bold">Target Product (What are we making?)</span>}
            rules={[{ required: true, message: 'Please select target product' }]}
          >
            <Select
              showSearch
              placeholder="Select Target Product"
              optionFilterProp="children"
              className="h-11"
              options={ingredients.map((i: any) => ({ label: i.name, value: i.id }))}
            />
          </Form.Item>

          <div className="mb-3 font-black text-slate-700 dark:text-slate-300">Raw Ingredients (Recipe)</div>
          
          <Form.List name="rawIngredients" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 12 }} align="baseline" className="w-full">
                    <Form.Item
                      {...restField}
                      name={[name, 'rawIngredientId']}
                      rules={[{ required: true, message: 'Missing ingredient' }]}
                      className="mb-0 w-[300px]"
                    >
                      <Select
                        showSearch
                        placeholder="Select Raw Ingredient"
                        optionFilterProp="children"
                        className="h-11"
                        options={ingredients.map((i: any) => ({ label: `${i.name} (${i.unit})`, value: i.id }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantityNeeded']}
                      rules={[{ required: true, message: 'Missing quantity' }]}
                      className="mb-0 w-[150px]"
                    >
                      <InputNumber placeholder="Quantity" min={0.01} step={0.01} className="w-full h-11 flex items-center" />
                    </Form.Item>
                    <MinusCircle onClick={() => remove(name)} className="text-rose-500 hover:text-rose-700 cursor-pointer w-5 h-5 ml-2 mt-2" />
                  </Space>
                ))}
                <Form.Item className="mt-4">
                  <Button type="dashed" onClick={() => add()} block icon={<Plus className="w-4 h-4" />} className="font-bold border-slate-300">
                    Add Raw Ingredient
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalVisible(false)} className="font-bold">Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-orange-500 hover:bg-orange-600 border-none font-bold px-6" icon={<Save className="w-4 h-4" />}>
              Save Recipe
            </Button>
          </div>
        </Form>
      </FormModal>
    </AnimatedPage>
  )
}
