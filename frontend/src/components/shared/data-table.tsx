import React from "react";
import { Table, Skeleton } from "antd";
import type { TableProps } from "antd";

interface DataTableProps<RecordType extends object = object> extends TableProps<RecordType> {
  containerClassName?: string;
  hideBorders?: boolean;
}

export function DataTable<RecordType extends object = object>({
  containerClassName = "",
  hideBorders = false,
  ...props
}: DataTableProps<RecordType>) {
  if (props.loading && (!props.dataSource || (Array.isArray(props.dataSource) && props.dataSource.length === 0))) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 w-full ${hideBorders ? "border-none shadow-none" : ""} ${containerClassName}`}>
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 
        overflow-hidden w-full
        /* Custom Table Styling Overrides */
        [&_.ant-table]:bg-transparent 
        [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:dark:bg-slate-800/50 
        [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-thead>tr>th]:dark:text-slate-300 
        [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:tracking-wider
        [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-slate-100 [&_.ant-table-tbody>tr>td]:dark:border-slate-800
        [&_.ant-table-tbody>tr:last-child>td]:border-b-0
        [&_.ant-table-tbody>tr:hover>td]:bg-slate-50/50 [&_.ant-table-tbody>tr:hover>td]:dark:bg-slate-800/50
        [&_.ant-table-cell]:text-slate-700 [&_.ant-table-cell]:dark:text-slate-200
        [&_.ant-pagination]:px-4 [&_.ant-pagination]:pb-4
        ${hideBorders ? "border-none shadow-none" : ""}
        ${containerClassName}
      `}
    >
      <Table
        pagination={{
          position: ['bottomRight'],
          showSizeChanger: true,
          ...props.pagination,
        }}
        scroll={{ x: 'max-content', ...props.scroll }}
        {...props}
      />
    </div>
  );
}
