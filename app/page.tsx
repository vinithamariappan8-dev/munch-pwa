'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_veg: boolean;
  image_url: string;
  is_available: boolean;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'Dine-in' | 'Takeaway' | 'Delivery'>('Dine-in');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Category & Veg Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegFilter, setVegFilter] = useState<'All' | 'Veg' | 'Non Veg'>('All');

  // Cart & Order Modal States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  // 🎟️ Coupon Code States
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('menu_items').select('*');
      if (error) {
        console.error('Error fetching menu:', error);
      } else if (data) {
        setMenuItems(data);
      }
      setLoading(false);
    };

    fetchMenuItems();
  }, []);

  // Cart Functions
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const subTotal = cart.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  const totalAmount = Math.max(0, subTotal - discount);

  // Coupon Code Verification
  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();

    if (code === 'MUNCH50') {
      setDiscount(50);
      setCouponApplied(true);
    } else if (code === 'WELCOME10') {
      const calculatedDiscount = Math.round(subTotal * 0.1); // 10% Discount
      setDiscount(calculatedDiscount);
      setCouponApplied(true);
    } else {
      setCouponError('Invalid Coupon Code! Try "MUNCH50"');
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setCouponApplied(false);
    setCouponCode('');
    setCouponError('');
  };

  // Place Order Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phoneNumber) {
      alert('Please enter your Name and Phone Number');
      return;
    }

    setPlacingOrder(true);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerName,
          phone_number: phoneNumber,
          total_amount: totalAmount,
          order_type: orderType,
          status: 'Pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      window.location.href = `/track/${orderData.id}`;
    } catch (err) {
      console.error('Order Error:', err);
      alert('Failed to place order. Try again!');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Filter Logic
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVeg =
      vegFilter === 'All' ? true : vegFilter === 'Veg' ? item.is_veg : !item.is_veg;

    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : item.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          item.name.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesVeg && matchesCategory;
  });

  const categories = ['All', 'Milkshakes', 'Shakes', 'Desserts', 'Drinks'];

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header - The Yard Milkshake Bar */}
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-pink-600">
              The Yard <span className="text-gray-900">Milkshake Bar</span> 🥤
            </h1>
          </div>
          <Link
            href="/admin"
            className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl transition"
          >
            👨‍🍳 Admin
          </Link>
        </div>

        {/* Order Type Tabs */}
        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
          {(['Dine-in', 'Takeaway', 'Delivery'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                orderType === type
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {type === 'Dine-in' ? '🍽️ Dine-in' : type === 'Takeaway' ? '🛍️ Takeaway' : '🛵 Delivery'}
            </button>
          ))}
        </div>

        {/* Search Input & Veg Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search shakes & treats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-pink-600 pl-9"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
          </div>

          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 text-xs font-bold">
            {(['All', 'Veg', 'Non Veg'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVegFilter(v)}
                className={`px-3 py-1 rounded-xl transition ${
                  vegFilter === v
                    ? v === 'Veg'
                      ? 'bg-green-600 text-white'
                      : v === 'Non Veg'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {v === 'Veg' ? '🟢 Veg' : v === 'Non Veg' ? '🔴 Non Veg' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat === 'Milkshakes' ? '🥤 Milkshakes' : cat === 'Shakes' ? '🍨 Shakes' : cat === 'Desserts' ? '🍰 Desserts' : cat === 'Drinks' ? '🧃 Drinks' : '✨ All Items'}
            </button>
          ))}
        </div>

        {/* Food Items List Grid */}
        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-gray-400">Loading Menu... 🥤</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-xs font-bold text-gray-400">No items found matching your filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const inCart = cart.find((c) => c.menuItem.id === item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex gap-4 items-center justify-between"
                >
                  <div className="flex gap-3 items-center">
                    <img
                      src={item.image_url || 'https://via.placeholder.com/100'}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
                        <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{item.description}</p>
                      <p className="font-black text-pink-600 text-xs">₹{item.price}</p>
                    </div>
                  </div>

                  {inCart ? (
                    <div className="flex items-center gap-2 bg-pink-50 p-1.5 rounded-xl border border-pink-200">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-lg bg-white font-black text-pink-600 shadow-sm flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-xs text-pink-600">{inCart.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-6 h-6 rounded-lg bg-pink-600 font-black text-white shadow-sm flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-pink-600 text-white p-4 rounded-3xl shadow-2xl flex justify-between items-center z-50 animate-fade-in">
          <div>
            <p className="text-[10px] font-bold text-pink-200 uppercase">
              {cart.reduce((a, b) => a + b.quantity, 0)} ITEMS IN CART
            </p>
            <p className="text-lg font-black">₹{totalAmount}</p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-white text-pink-600 font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md hover:bg-pink-50 transition"
          >
            View Cart & Checkout →
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 animate-slide-up">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-black text-base text-gray-800">Your Order Details 🛒</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 font-bold hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {cart.map((c) => (
                <div key={c.menuItem.id} className="flex justify-between items-center text-xs bg-gray-50 p-2.5 rounded-xl">
                  <div>
                    <p className="font-bold text-gray-800">{c.menuItem.name}</p>
                    <p className="text-[10px] text-gray-400">Qty: {c.quantity}</p>
                  </div>
                  <span className="font-bold text-pink-600">₹{c.menuItem.price * c.quantity}</span>
                </div>
              ))}
            </div>

            {/* 🎟️ Coupon Code Section */}
            <div className="bg-pink-50/60 p-3 rounded-2xl border border-pink-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-pink-900">Have a Promo Code?</span>
                <span className="text-[10px] font-mono font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-lg">Try: MUNCH50</span>
              </div>

              {!couponApplied ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. MUNCH50)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full border rounded-xl px-3 py-1.5 text-xs font-bold uppercase bg-white focus:outline-pink-600"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-green-100 border border-green-200 p-2 rounded-xl text-xs font-bold text-green-800">
                  <span>🎉 Coupon '{couponCode.toUpperCase()}' Applied! (-₹{discount})</span>
                  <button onClick={handleRemoveCoupon} className="text-red-600 hover:underline text-[10px] font-bold">
                    Remove
                  </button>
                </div>
              )}

              {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
            </div>

            {/* Bill Summary */}
            <div className="space-y-1 border-t pt-2 text-xs">
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Subtotal</span>
                <span>₹{subTotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-2 font-bold text-gray-800">
                <span>Total Amount</span>
                <span className="text-green-600 text-sm font-black">₹{totalAmount}</span>
              </div>
            </div>

            {/* Customer Form */}
            <form onSubmit={handlePlaceOrder} className="space-y-3">
              <input
                type="text"
                placeholder="Your Name *"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-pink-600 bg-gray-50"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full border rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-pink-600 bg-gray-50"
              />

              <button
                type="submit"
                disabled={placingOrder}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition"
              >
                {placingOrder ? 'Placing Order...' : 'Confirm Order 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}