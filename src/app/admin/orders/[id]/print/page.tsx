import React from 'react'
import { notFound } from 'next/navigation'
import { getAdminOrderById } from '@/lib/services/orders'
import { Store, Phone } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Packing Slip | Baqqala Grocery',
}

export default async function OrderPrintSlipPage({ params }: PageProps) {
  const { id } = await params
  const order = await getAdminOrderById(id)

  if (!order) {
    notFound()
  }

  const customerName = order.recipient_name || order.customer?.name || 'Customer'
  const customerPhone = order.recipient_phone || order.customer?.mobile || '—'

  return (
    <div className="min-h-screen bg-white text-black p-8 max-w-3xl mx-auto text-xs font-sans print:p-0 print:max-w-none">
      {/* Print Trigger Button (Hidden in Print) */}
      <div className="mb-6 flex items-center justify-between print:hidden border-b pb-4">
        <div>
          <h1 className="text-base font-bold text-gray-800">Printable Packing Slip</h1>
          <p className="text-gray-500 text-xs">Press print or Ctrl+P to print this slip.</p>
        </div>
        <button
          onClick={undefined}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          Print Slip
        </button>
      </div>

      {/* Slip Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-black" />
            <h2 className="text-xl font-black uppercase tracking-wider">Baqqala Grocery</h2>
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">Zone 19, Abu Dhabi, United Arab Emirates</p>
          <p className="text-[11px] text-gray-600">Store Tel: +971 2 555 1900</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block">
            Fulfillment Packing Slip
          </span>
          <span className="text-lg font-black font-mono block">{order.order_number}</span>
          <span className="text-[11px] text-gray-600 block">
            Date: {new Date(order.order_date).toLocaleDateString()} {new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Delivery & Customer Details Box */}
      <div className="grid grid-cols-2 gap-4 border border-black rounded-lg p-4 mb-6 bg-gray-50/50">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Customer Contact
          </span>
          <p className="font-bold text-sm text-black">{customerName}</p>
          <p className="font-mono text-xs text-gray-800 mt-0.5 flex items-center gap-1">
            <Phone className="h-3 w-3" /> {customerPhone}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Delivery Destination (Zone 19)
          </span>
          <p className="font-semibold text-xs leading-relaxed text-black">
            {order.delivery_address}
          </p>
        </div>
      </div>

      {/* Special Instructions Callout */}
      {order.delivery_notes && (
        <div className="border-2 border-dashed border-black rounded-lg p-3 mb-6 bg-yellow-50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-black block mb-0.5">
            Special Customer Instructions:
          </span>
          <p className="text-xs font-medium text-black italic">
            &ldquo;{order.delivery_notes}&rdquo;
          </p>
        </div>
      )}

      {/* Packing Checklist Table */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
          Ordered Grocery Items Checklist ({order.order_items.length} items)
        </h3>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-gray-600 font-bold">
              <th className="py-2 px-1 w-10 text-center">Check</th>
              <th className="py-2 px-2">Item Description</th>
              <th className="py-2 px-2 font-mono">SKU</th>
              <th className="py-2 px-2 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.order_items.map((item) => (
              <tr key={item.id} className="text-black">
                <td className="py-2.5 px-1 text-center">
                  <div className="w-4 h-4 border-2 border-black rounded-xs mx-auto" />
                </td>
                <td className="py-2.5 px-2">
                  <span className="font-bold block text-sm">{item.product_name}</span>
                </td>
                <td className="py-2.5 px-2 font-mono text-gray-600">
                  {item.product?.sku || '—'}
                </td>
                <td className="py-2.5 px-2 text-right font-black font-mono text-sm">
                  {item.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sign-off Footer */}
      <div className="border-t-2 border-black pt-4 grid grid-cols-2 gap-8 text-[11px] mt-8">
        <div>
          <p className="font-bold mb-4">Packed By Store Staff:</p>
          <div className="border-b border-black w-48 mb-1" />
          <p className="text-gray-500 text-[10px]">Staff Signature & Time</p>
        </div>

        <div>
          <p className="font-bold mb-4">Received By Driver / Customer:</p>
          <div className="border-b border-black w-48 mb-1" />
          <p className="text-gray-500 text-[10px]">Driver or Recipient Signature</p>
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] text-gray-500">
        Baqqala Grocery • Serving Zone 19, Abu Dhabi • Thank you for your order!
      </div>
    </div>
  )
}
