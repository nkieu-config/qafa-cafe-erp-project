import React from 'react';
import { Modal } from 'antd';
import { LucideIcon } from 'lucide-react';

interface FormModalProps {
  title: string;
  icon?: LucideIcon;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
  destroyOnHidden?: boolean;
  forceRender?: boolean;
}

export function FormModal({
  title,
  icon: Icon,
  isOpen,
  onClose,
  children,
  width = 800,
  destroyOnHidden = false,
  forceRender = true,
}: FormModalProps) {
  return (
    <Modal
      title={
        <div className="text-lg font-bold flex items-center gap-2 mb-2">
          {Icon && <Icon className="w-5 h-5 text-indigo-500" />}
          {title}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={width}
      forceRender={forceRender}
      destroyOnHidden={destroyOnHidden}
      className="dark:[&_.ant-modal-content]:bg-slate-900 [&_.ant-modal-content]:rounded-2xl"
    >
      <div className="mt-4">
        {children}
      </div>
    </Modal>
  );
}
