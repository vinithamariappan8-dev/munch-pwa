'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface OrderItemDetail {
  id: string;
  quantity: number;
  price: number;
  menu_items: {
    name: string;
    image_url?: string;
  } | null;
}

interface OrderDetails {
  id: string;
  customer_name: string;
  phone_number: string;
  total_amount: number;
  status: string;
  order_type?: string;
  created_at?: string;
}

const statusSteps = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered'];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderData = async () => {
      setLoading(true);

      // 1. Fetch Order Details
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderErr) {
        console.error('Error fetching order:', orderErr);
      } else {
        setOrder(orderData);
      }

      // 2. Fetch Order Items
      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          menu_items (
            name,
            image_url
          )
        `)
        .eq('order_id', orderId);

      if (itemsErr) {
        console.error('Error fetching order items:', itemsErr);
      } else if (itemsData) {
        setOrderItems(itemsData as unknown as OrderItemDetail[]);
      }

      setLoading(false);
    };

    fetchOrderData();

    // Realtime Listener
    const channel = supabase
      .channel(`order-track-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as OrderDetails);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Clean Native Print / Save as PDF Handler
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
        <div className="text-gray-500 font-bold text-sm">Loading Order Tracking... 📦</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-md text-center max-w-sm w-full">
          <h2 className="text-lg font-bold text-red-500 mb-2">Order Not Found</h2>
          <p className="text-xs text-gray-500 mb-4">Invalid Order ID or the order has been removed.</p>
          <Link href="/" className="inline-block bg-amber-800 text-white text-xs font-bold px-4 py-2 rounded-xl">
            Back to Munch Menu
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status) !== -1 ? statusSteps.indexOf(order.status) : 0;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-6 print:shadow-none print:max-w-full">
        
        {/* Printable Receipt Container */}
        <div className="space-y-5 bg-white p-2 rounded-xl">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-black text-amber-800">MUNCH RESTAURANT 🍔</h1>
            <p className="text-xs font-bold text-gray-700 mt-1">Official Order Receipt</p>
            <p className="text-[10px] text-gray-400 font-mono mt-1 break-all">
              Order ID: #{order.id}
            </p>
          </div>

          {/* Customer Details */}
          <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-1.5 text-gray-700 print:border">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Customer:</span>
              <span className="font-bold text-gray-800">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Phone:</span>
              <span className="font-bold text-gray-800">{order.phone_number}</span>
            </div>
            {order.order_type && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-500">Order Type:</span>
                <span className="font-bold text-amber-800">{order.order_type}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1.5 mt-1">
              <span className="font-semibold text-gray-500">Total Amount:</span>
              <span className="font-black text-green-600 text-sm">₹{order.total_amount}</span>
            </div>
          </div>

          {/* Ordered Items List */}
          {orderItems.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Items Ordered ({orderItems.length})
              </h3>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl text-xs print:border">
                    <div className="flex items-center gap-2.5">
                      {item.menu_items?.image_url && (
                        <img
                          src={item.menu_items.image_url}
                          alt={item.menu_items.name}
                          className="w-8 h-8 rounded-lg object-cover print:hidden"
                        />
                      )}
                      <div>
                        <p className="font-bold text-gray-800">{item.menu_items?.name || 'Food Item'}</p>
                        <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-700">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Status Tracker (Hidden in PDF Print) */}
        <div className="border-t pt-4 print:hidden">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            Live Status
          </h3>
          <div className="space-y-4 pl-2">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step} className="flex items-start gap-3 relative">
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`absolute left-3 top-6 w-0.5 h-6 -ml-[1px] transition-colors duration-300 ${
                        index < currentStepIndex ? 'bg-amber-800' : 'bg-gray-200'
                      }`}
                    />
                  )}

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                      isCurrent
                        ? 'bg-amber-800 text-white ring-4 ring-amber-100 scale-110'
                        : isCompleted
                        ? 'bg-amber-800 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>

                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-amber-800' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {step}
                    </p>
                    {isCurrent && (
                      <p className="text-[10px] text-gray-400 font-medium">Your food is currently in this stage!</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: PDF / Print (Hidden when printing) */}
        <div className="border-t pt-4 space-y-3 text-center print:hidden">
          <button
            onClick={handlePrint}
            className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition flex items-center justify-center gap-2"
          >
            🖨️ Print / Save Invoice as PDF
          </button>

          <div>
            <Link href="/" className="text-xs font-bold text-gray-500 hover:text-amber-800 transition">
              ← Back to Munch Menu
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}