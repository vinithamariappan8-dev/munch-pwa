'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface OrderItem {
  id: string;
  quantity: number;
  menu_items?: {
    name: string;
  };
}

interface Order {
  id: string;
  customer_name: string;
  phone_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'reviews'>('orders');

  const fetchData = async () => {
    try {
      // Fetch Orders safely
      const ordersRes = await fetch('/api/admin/orders');
      if (ordersRes.ok) {
        const ordersJson = await ordersRes.json();
        if (ordersJson.success) setOrders(ordersJson.data || []);
      } else {
        console.error('Failed to fetch orders, status:', ordersRes.status);
      }

      // Fetch Reviews safely
      const reviewsRes = await fetch('/api/admin/reviews');
      if (reviewsRes.ok) {
        const reviewsJson = await reviewsRes.json();
        if (reviewsJson.success) setReviews(reviewsJson.data || []);
      } else {
        console.error('Failed to fetch reviews, status:', reviewsRes.status);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Order Status Function
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      const json = await res.json();

      if (json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Status updated to ${newStatus}`,
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Update Failed', text: json.error });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xl font-medium">Loading Admin Dashboard...</div>;
  }

  return (
    <main className="p-6 max-w-6xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage orders and view customer feedback</p>
        </div>
        <button
          onClick={fetchData}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-2 rounded-xl font-bold transition ${
            activeTab === 'orders'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📦 Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-2 rounded-xl font-bold transition ${
            activeTab === 'reviews'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ⭐ Reviews ({reviews.length})
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No orders found yet!
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-mono font-bold text-gray-700">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-900">{order.customer_name || 'Guest'}</p>
                        <p className="text-xs text-gray-500">{order.phone_number}</p>
                      </td>
                      <td className="p-4 max-w-xs">
                        {order.order_items && order.order_items.length > 0 ? (
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {order.order_items.map((item) => (
                              <li key={item.id}>
                                {item.menu_items?.name || 'Item'} x {item.quantity}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-green-600">₹{order.total_amount}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status || 'Pending'}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="border rounded-lg p-1.5 text-xs font-semibold bg-white focus:outline-orange-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white border rounded-2xl">
              No customer reviews submitted yet!
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{rev.customer_name || 'Anonymous'}</h3>
                    <p className="text-xs text-gray-400">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-yellow-500 text-sm font-bold">
                    {'⭐'.repeat(rev.rating)} ({rev.rating}/5)
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl italic">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}