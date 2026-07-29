'use client';

import { useEffect, useState } from 'react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menu_items: { name: string } | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer_name: string;
  phone_number: string;
  order_items: OrderItem[];
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-xl font-medium">Loading Orders...</div>;

  return (
    <main className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🍳 Kitchen & Admin Dashboard</h1>
        <button 
          onClick={fetchOrders}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          🔄 Refresh Orders
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-xl font-semibold text-gray-500">No orders found yet!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 border-b pb-2">
                  <div>
                    <p className="text-xs text-gray-400">ORDER ID</p>
                    <p className="font-mono text-sm font-bold text-gray-700">{order.id.slice(0, 8)}...</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Customer Details Display */}
                <div className="bg-orange-50 p-3 rounded-lg mb-3 border border-orange-100">
                  <p className="text-xs text-orange-600 font-bold">CUSTOMER DETAILS</p>
                  <p className="font-semibold text-gray-800 text-sm">👤 {order.customer_name || 'N/A'}</p>
                  <p className="text-gray-600 text-sm">📞 {order.phone_number || 'N/A'}</p>
                </div>

                <div className="my-4 space-y-2">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-800">
                        {item.menu_items?.name || 'Item'} x {item.quantity}
                      </span>
                      <span className="text-gray-500">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <div className="flex justify-between font-bold text-lg mb-4">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{order.total_amount}</span>
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}