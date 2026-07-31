'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Order {
  id: string;
  customer_name: string;
  phone_number: string;
  total_amount: number;
  status: string;
  order_type?: string;
  created_at: string;
}

interface TopItem {
  name: string;
  count: number;
  revenue: number;
}

export default function AdminDashboardPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Check login session on load
  useEffect(() => {
    const session = sessionStorage.getItem('admin_authenticated');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Admin Password Verification Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default Admin Password: admin123
    if (passwordInput === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect Password! Try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Sound play logic
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.3);
      }, 150);
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const fetchAnalyticsAndOrders = async () => {
    setLoading(true);

    // 1. Fetch Orders
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (orderErr) console.error('Error fetching orders:', orderErr);
    else if (orderData) setOrders(orderData);

    // 2. Fetch Order Items for Top Selling Analytics
    const { data: itemsData, error: itemsErr } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        menu_items ( name )
      `);

    if (itemsErr) {
      console.error('Error fetching items analytics:', itemsErr);
    } else if (itemsData) {
      const itemMap: { [key: string]: { count: number; revenue: number } } = {};

      itemsData.forEach((item: any) => {
        const itemName = item.menu_items?.name || 'Unknown Item';
        const qty = item.quantity || 1;
        const total = (item.price || 0) * qty;

        if (!itemMap[itemName]) {
          itemMap[itemName] = { count: 0, revenue: 0 };
        }
        itemMap[itemName].count += qty;
        itemMap[itemName].revenue += total;
      });

      const sortedTopItems = Object.keys(itemMap)
        .map((name) => ({
          name,
          count: itemMap[name].count,
          revenue: itemMap[name].revenue,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopItems(sortedTopItems);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAnalyticsAndOrders();

    // Realtime Listener
    const channel = supabase
      .channel('admin-analytics-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((prev) => [newOrder, ...prev]);
          playNotificationSound();
          setNewOrderAlert(`🔔 New Order received from ${newOrder.customer_name}! (₹${newOrder.total_amount})`);
          setTimeout(() => setNewOrderAlert(null), 5000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders((prev) =>
            prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) alert('Failed to update status');
  };

  // 🔐 LOGIN SCREEN (If not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-gray-800">Admin Portal 👨‍🍳</h1>
            <p className="text-xs text-gray-500">Enter password to access Munch Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter Password (admin123)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3 text-xs bg-gray-50 font-bold focus:outline-amber-800"
              />
              {authError && <p className="text-[11px] text-red-500 font-bold mt-2 text-center">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition"
            >
              Unlock Dashboard 🔓
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Metrics Calculation
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'Delivered').length;

  const filteredOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter((o) => o.status === filterStatus);

  // 📊 MAIN DASHBOARD SCREEN (When Authenticated)
  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Admin Analytics & Dashboard 👨‍🍳</h1>
            <p className="text-xs text-gray-500 mt-1">Real-time revenue, order metrics & top items</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={playNotificationSound}
              className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl transition"
            >
              🔊 Test Sound
            </button>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl transition"
            >
              🔒 Logout
            </button>
          </div>
        </div>

        {/* Floating Alert */}
        {newOrderAlert && (
          <div className="bg-amber-800 text-white font-bold text-xs p-4 rounded-2xl shadow-lg animate-bounce flex justify-between items-center">
            <span>{newOrderAlert}</span>
            <button onClick={() => setNewOrderAlert(null)} className="text-xs font-black ml-4">✕</button>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Revenue</p>
            <p className="text-2xl font-black text-green-600 mt-2">₹{totalRevenue}</p>
            <p className="text-[10px] text-gray-400 mt-1">From all recorded orders</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p>
            <p className="text-2xl font-black text-amber-800 mt-2">{totalOrders}</p>
            <p className="text-[10px] text-gray-400 mt-1">{completedOrders} Completed / Delivered</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase">Avg. Order Value</p>
            <p className="text-2xl font-black text-blue-600 mt-2">
              ₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Per transaction average</p>
          </div>
        </div>

        {/* Top Selling Items & Filter Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Selling Food Items */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm lg:col-span-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              🔥 Top Selling Items
            </h3>
            {topItems.length === 0 ? (
              <p className="text-xs text-gray-400 font-medium">No sales data yet.</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, idx) => (
                  <div key={item.name} className="flex justify-between items-center text-xs bg-gray-50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-400 text-[10px]">#{idx + 1}</span>
                      <span className="font-bold text-gray-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-amber-800">{item.count} sold</span>
                      <p className="text-[10px] text-gray-400">₹{item.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders History & Status Filter Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-2">
              <h3 className="font-bold text-sm text-gray-700">Order History ({filteredOrders.length})</h3>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">Filter:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border rounded-xl px-2.5 py-1 text-xs bg-gray-50 font-bold text-gray-700 focus:outline-amber-800"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs font-bold text-gray-400">Loading order history...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-gray-400">No orders match this filter.</div>
            ) : (
              <div className="overflow-x-auto max-h-[350px]">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 font-bold text-gray-500 uppercase border-b sticky top-0">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono font-bold text-gray-800">
                          #{ord.id.substring(0, 8)}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-gray-800">{ord.customer_name}</p>
                          <p className="text-[10px] text-gray-400">{ord.phone_number}</p>
                        </td>
                        <td className="p-3 font-bold text-green-600">
                          ₹{ord.total_amount}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'Delivered'
                                ? 'bg-green-100 text-green-700'
                                : ord.status === 'Preparing'
                                ? 'bg-blue-100 text-blue-700'
                                : ord.status === 'Out for Delivery'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={ord.status}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs bg-white font-bold text-gray-700 focus:outline-amber-800"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}