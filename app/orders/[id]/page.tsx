'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name?: string;
  item_name?: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  id: string;
  customer_name: string;
  phone_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
  items?: OrderItem[];
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrderStatus = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
      } else {
        setError(json.error || 'Order not found');
      }
    } catch (err) {
      setError('Failed to fetch order status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();
    // Auto refresh status every 4 seconds
    const interval = setInterval(fetchOrderStatus, 4000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return <div className="p-8 text-center font-bold text-gray-600">Loading order status... 🛵</div>;
  }

  if (error || !order) {
    return (
      <main className="p-6 max-w-md mx-auto text-center min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Order Not Found 🙁</h2>
        <p className="text-gray-600 mb-6">{error || "We couldn't find the order you are looking for."}</p>
        <Link href="/" className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-600">
          Back to Menu
        </Link>
      </main>
    );
  }

  const status = order.status || 'Pending';

  // Stepper logic
  const steps = [
    { label: 'Order Received', key: 'Pending', icon: '📝' },
    { label: 'Preparing Food', key: 'Preparing', icon: '🍳' },
    { label: 'Out for Delivery / Delivered', key: 'Delivered', icon: '🛵' },
  ];

  const getStepStatus = (stepKey: string) => {
    if (status === 'Delivered') return 'completed';
    if (status === 'Preparing') {
      if (stepKey === 'Pending' || stepKey === 'Preparing') return 'completed';
    }
    if (status === 'Pending' && stepKey === 'Pending') return 'completed';
    return 'upcoming';
  };

  return (
    <main className="p-6 max-w-md mx-auto min-h-screen pb-12">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-sm font-bold text-orange-600 hover:underline">
          ← Back to Menu
        </Link>
        <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full animate-pulse">
          Live Tracking
        </span>
      </div>

      <div className="bg-white border rounded-3xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Track Order #{order.id.slice(0, 8)}</h1>
        <p className="text-xs text-gray-400 mb-6">Customer: {order.customer_name || 'Guest'}</p>

        {/* Status Stepper */}
        <div className="space-y-6 relative border-l-2 border-orange-200 ml-4 pl-6 my-8">
          {steps.map((step) => {
            const stepState = getStepStatus(step.key);
            const isCompleted = stepState === 'completed';

            return (
              <div key={step.key} className="relative">
                {/* Circle Icon Indicator */}
                <div
                  className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    isCompleted
                      ? 'bg-orange-500 text-white shadow-md scale-110'
                      : 'bg-gray-100 text-gray-400 border border-gray-300'
                  }`}
                >
                  {step.icon}
                </div>

                <div>
                  <p className={`font-bold text-sm ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {status === step.key && (
                    <span className="inline-block mt-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-bold">
                      Current Status
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Details Summary */}
        <div className="border-t pt-4 mt-6">
          <p className="text-xs font-bold text-gray-500 mb-2">ORDER SUMMARY:</p>
          <div className="space-y-2">
            {(order.order_items || order.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.name || item.item_name || 'Food Item'}
                </span>
                <span className="font-semibold text-gray-800">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-base border-t mt-4 pt-3 text-gray-800">
            <span>Total Paid:</span>
            <span className="text-green-600">₹{order.total_amount}</span>
          </div>
        </div>
      </div>
    </main>
  );
}