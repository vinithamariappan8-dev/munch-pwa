'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  rating?: number;
  rating_count?: number;
  image_url?: string;
  is_veg?: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // 🔍 Search & Diet Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');

  // Customer Details Form State
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎟️ Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Fetch Menu Items from Supabase
  useEffect(() => {
    async function fetchMenu() {
      const { data, error } = await supabase.from('menu_items').select('*');
      if (error) {
        console.error('Error fetching menu:', error);
      } else if (data) {
        setMenuItems(data);
      }
    }
    fetchMenu();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  // Cart Functions
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Calculations
  const rawSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, rawSubtotal - discount);

  // 🎟️ Apply Coupon Handler
  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode.trim()) {
      setCouponError('Please enter a code');
      return;
    }

    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartTotal: rawSubtotal }),
      });

      const data = await res.json();

      if (data.success) {
        setAppliedCoupon({ code: data.code, discount: data.discount });
        setCouponSuccess(data.message);
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid code');
      }
    } catch (err) {
      setCouponError('Failed to apply coupon');
    }
  };

  // Place Order Handler
  const handlePlaceOrder = async () => {
    if (!customerName || !phoneNumber) {
      alert('Please fill in your Name and Phone Number!');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: customerName,
            phone_number: phoneNumber,
            total_amount: finalTotal,
            status: 'Pending',
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsToInsert = cart.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      alert(`Order Placed Successfully! Order ID: #${orderData.id.slice(0, 8)}`);

      setCart([]);
      setCustomerName('');
      setPhoneNumber('');
      setAppliedCoupon(null);
    } catch (err: any) {
      console.error('Error placing order:', err);
      alert('Failed to place order: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logic: Category + Search Bar + Veg/Non-Veg
  const categories = ['All', 'Pizza', 'Burgers', 'Drinks'];
  
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      item.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const isVeg = item.is_veg ?? !item.name.toLowerCase().includes('chicken');
    const matchesDiet =
      dietFilter === 'All' ||
      (dietFilter === 'Veg' && isVeg) ||
      (dietFilter === 'Non-Veg' && !isVeg);

    return matchesCategory && matchesSearch && matchesDiet;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* LEFT: Menu Items List */}
      <main className="flex-1 p-6 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Munch Menu</h1>

        {/* 🔍 Search Bar & Veg/Non-Veg Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-semibold focus:outline-amber-800 shadow-sm"
            />
            <span className="absolute left-3 top-2 text-gray-400 text-xs">🔍</span>
          </div>

          <div className="flex bg-gray-200 p-1 rounded-xl text-xs font-bold w-full sm:w-auto justify-center">
            <button
              onClick={() => setDietFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dietFilter === 'All' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietFilter('Veg')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                dietFilter === 'Veg' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              🟢 Veg
            </button>
            <button
              onClick={() => setDietFilter('Non-Veg')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                dietFilter === 'Non-Veg' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              🔴 Non-Veg
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full font-bold text-sm transition ${
                selectedCategory === cat
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMenuItems.length === 0 ? (
            <div className="col-span-2 text-center py-10 bg-white rounded-2xl border text-gray-400 text-sm font-medium">
              No food items found matching your search.
            </div>
          ) : (
            filteredMenuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border flex gap-4 items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-gray-400">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    'Food'
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    {item.name}
                    <span className="text-[10px]">
                      {(item.is_veg ?? !item.name.toLowerCase().includes('chicken')) ? '🟢' : '🔴'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 my-1 line-clamp-1">{item.description || 'Delicious food item'}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-gray-800">₹{item.price}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-amber-800 hover:bg-amber-900 text-white px-4 py-1.5 rounded-xl font-bold text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* RIGHT: Cart & Checkout Sidebar (Shows ONLY when cart has items) */}
      {cart.length > 0 && (
        <aside className="w-full md:w-80 bg-white p-6 border-l flex flex-col justify-between shadow-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">Your Cart</h2>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">₹{item.price} x {item.quantity}</p>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="text-gray-600 font-bold px-1"
                    >
                      -
                    </button>
                    <span className="font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="text-gray-600 font-bold px-1"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 🎟️ PROMO CODE / COUPON SECTION */}
            <div className="p-3 my-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase">Have a Promo Code?</p>

              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. MUNCH50"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs uppercase flex-1 focus:outline-amber-800 bg-white font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-amber-800 text-white font-bold text-xs px-3 py-1 rounded-lg hover:bg-amber-900 transition"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center text-xs font-bold text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                  <span>🎟️ '{appliedCoupon.code}' Applied</span>
                  <div className="flex items-center gap-1">
                    <span>-₹{appliedCoupon.discount}</span>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-red-500 text-[10px] underline ml-2 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {couponError && <p className="text-red-500 text-[10px] mt-1 font-medium">{couponError}</p>}
              {couponSuccess && !appliedCoupon && <p className="text-green-600 text-[10px] mt-1 font-bold">{couponSuccess}</p>}
            </div>

            {/* Customer Details Form */}
            <div className="mt-4 pt-4 border-t space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase">Customer Details</h3>

              <div>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-amber-800"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-amber-800"
                />
              </div>
            </div>
          </div>

          {/* Bill Summary & Place Order Button */}
          <div className="mt-6 pt-4 border-t">
            {appliedCoupon && (
              <div className="flex justify-between text-xs text-green-600 font-bold mb-1">
                <span>Discount:</span>
                <span>-₹{discount}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-gray-800 text-base mb-4">
              <span>Total Amount:</span>
              <span className="text-green-600">₹{finalTotal}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50 text-sm"
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}