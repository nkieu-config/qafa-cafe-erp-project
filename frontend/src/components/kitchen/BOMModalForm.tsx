import { Form, Select, InputNumber, Space, Button } from "antd"
import { FormModal } from "@/components/shared/form-modal"
import { Plus, MinusCircle, Save } from "lucide-react"
import { toast } from "sonner"
import { useCreateProductionBOM } from '@/hooks/domains/useAccountingQueries'
import { Ingredient } from "@/types/api"

interface BOMModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
}

export function BOMModalForm({ isOpen, onClose, ingredients }: BOMModalFormProps) {
  const [form] = Form.useForm();
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
      onClose();
      form.resetFields();
    } catch (error: unknown) {
      if (error instanceof Error) toast.error("Failed to create BOM");
    }
  }

  return (
    <FormModal
      title="Create / Update BOM"
      isOpen={isOpen}
      onClose={onClose}
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
            options={ingredients.map((i: Ingredient) => ({ label: i.name, value: i.id }))}
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
                      options={ingredients.map((i: Ingredient) => ({ label: `${i.name} (${i.unit})`, value: i.id }))}
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
          <Button onClick={onClose} className="font-bold">Cancel</Button>
          <Button type="primary" htmlType="submit" className="bg-orange-500 hover:bg-orange-600 border-none font-bold px-6" icon={<Save className="w-4 h-4" />}>
            Save Recipe
          </Button>
        </div>
      </Form>
    </FormModal>
  )
}
