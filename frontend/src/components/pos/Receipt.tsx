import React, { forwardRef } from 'react';
import { Coffee } from 'lucide-react';
import { Order, OrderItem, Product } from '@/types/api';

export const Receipt = forwardRef<HTMLDivElement, { order: any; branchName?: string }>(
  ({ order, branchName }, ref) => {
    if (!order) return null;

    const date = new Date().toLocaleString('th-TH', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });

    return (
      <div 
        ref={ref} 
        style={{
          width: '80mm',
          padding: '2mm',
          background: 'white',
          color: 'black',
          fontFamily: "'SF Mono', Consolas, Menlo, monospace",
          fontSize: '12px',
          lineHeight: '1.4',
          margin: '0 auto'
        }}
        className="print:shadow-none shadow-lg"
      >
        <style>
          {`
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}
        </style>

        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
            <Coffee size={24} color="black" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 2px 0', letterSpacing: '1px' }}>QAFA CAFE</h2>
          <p style={{ margin: '0', fontSize: '11px' }}>{branchName || 'Headquarters'}</p>
          <p style={{ margin: '0', fontSize: '10px', color: '#333' }}>TAX ID: 010556XXXXXX0</p>
          <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>TAX INVOICE / RECEIPT</p>
        </div>

        <div style={{ borderBottom: '1px dashed black', paddingBottom: '4px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Date: {date}</span>
            <span>Ref: #{order.id || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cashier: {order.cashier?.name || 'System'}</span>
            <span>POS: 01</span>
          </div>
          {order.customerName && (
            <div style={{ marginTop: '2px' }}>
              <span>Member: {order.customerName}</span>
            </div>
          )}
        </div>

        <table style={{ width: '100%', marginBottom: '4px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed black' }}>
              <th style={{ width: '60%', textAlign: 'left', paddingBottom: '4px', fontWeight: 'normal' }}>Item</th>
              <th style={{ width: '15%', textAlign: 'center', paddingBottom: '4px', fontWeight: 'normal' }}>Qty</th>
              <th style={{ width: '25%', textAlign: 'right', paddingBottom: '4px', fontWeight: 'normal' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td style={{ padding: '2px 0', verticalAlign: 'top', wordBreak: 'break-word', paddingRight: '4px' }}>
                  <div style={{ fontWeight: 'bold' }}>{item.product.name}</div>
                  {item.notes && <div style={{ fontSize: '9px', color: '#555', marginTop: '1px' }}>- {item.notes}</div>}
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'top', padding: '2px 0' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '2px 0' }}>{(item.product.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed black', paddingTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>{order.subtotal?.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount</span>
              <span>-฿{(order.discount || 0).toFixed(2)}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '10px' }}>
            <span>VAT (7% Included)</span>
            <span>{((order.netTotal || 0) * 0.07 / 1.07).toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginTop: '4px', borderTop: '1px solid black', paddingTop: '4px' }}>
            <span>NET TOTAL</span>
            <span>{order.netTotal?.toFixed(2)} THB</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed black', marginTop: '4px', paddingTop: '4px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment Method</span>
            <span>QR / Cash</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <div style={{ border: '1px solid black', padding: '4px', margin: '0 auto 6px auto', width: '80%', fontSize: '10px', letterSpacing: '3px', fontFamily: 'monospace' }}>
            ||| | || |||| | ||| ||
            <br/>{String(order.id).padStart(10, '0')}
          </div>
          <p style={{ margin: '0', fontWeight: 'bold' }}>Thank You For Visiting!</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#555' }}>Powered by QafaCafe ERP</p>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
