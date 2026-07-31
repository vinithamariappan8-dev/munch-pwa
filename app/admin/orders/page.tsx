'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Order {
  id: string;
  customer_name: string;
  phone_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function AdminOrders() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Set your secret Admin PIN here
  const ADMIN_PIN = '1234';

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchOrders();
    }
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setPinError('');
      fetchOrders();
    } else {
      setPinError('Incorrect PIN! Try again.');
      setPinInput('');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  // 🔄 Update Order Status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } else {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setPinInput('');
  };

  // Status Badge Colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Out for Delivery':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // 🔒 SCREEN 1: PIN LOCK
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🔒
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Admin Access</h2>
          <p className="text-xs text-gray-500 mb-6">Enter PIN to view restaurant orders</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              placeholder="Enter PIN (Default: 1234)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center tracking-widest text-xl font-bold py-3 border border-gray-300 rounded-xl focus:outline-amber-800 bg-gray-50"
            />

            {pinError && <p className="text-red-500 text-xs font-bold">{pinError}</p>}

            <button
              type="submit"
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 rounded-xl shadow-lg transition text-sm"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 📊 SCREEN 2: ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">Admin Dashboard</h1>
            <p className="text-xs text-gray-500">Live Orders Management</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            🔒 Lock Session
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500 font-bold">Loading Orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-gray-400 font-medium">
            No orders placed yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-xs text-amber-800">
                    Order #{order.id.slice(0, 8)}
                  </span>
                  
                  {/* Status Dropdown */}
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border focus:outline-none cursor-pointer ${getStatusColor(
                      order.status
                    )}`}
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Preparing">👨‍🍳 Preparing</option>
                    <option value="Out for Delivery">🛵 Out for Delivery</option>
                    <option value="Delivered">✅ Delivered</option>
                    <option value="Cancelled">❌ Cancelled</option>
                  </select>
                </div>

                <div className="text-xs space-y-1 text-gray-600">
                  <p><span className="font-bold text-gray-800">Customer:</span> {order.customer_name}</p>
                  <p><span className="font-bold text-gray-800">Phone:</span> {order.phone_number}</p>
                  <p><span className="font-bold text-gray-800">Date:</span> {new Date(order.created_at).toLocaleString()}</p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t mt-3">
                  <span className="text-xs font-bold text-gray-500">Total Amount</span>
                  <span className="text-base font-extrabold text-green-600">₹{order.total_amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}