'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  category_id?: string;
  is_veg?: boolean;
  image_url?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Phase 3 - Category Selection & Order Type
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [orderType, setOrderType] = useState<'Dine-in' | 'Takeaway' | 'Delivery'>('Dine-in');

  // Search & Diet Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');

  // Customer Form
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coupons
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Default Fallback Food Images
  const defaultImages: Record<string, string> = {
    'Margherita Pizza': 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80',
    'Pepperoni Pizza': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80',
    'Veg Supreme Burger': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&q=80',
    'Chicken Cheese Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
    'Cold Coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
  };

  // Dynamic Categories from fetched menu items
  const categories = ['All', ...Array.from(new Set(menuItems.map((item) => item.category).filter(Boolean))) as string[]];

  // Fetch Menu from Supabase
  useEffect(() => {
    async function fetchMenu() {
      setLoading(true);
      const { data, error } = await supabase.from('menu_items').select('*');
      
      if (error) {
        console.error('Error fetching menu:', error);
      } else if (data) {
        setMenuItems(data);
      }
      setLoading(false);
    }
    fetchMenu();
  }, []);

  // Cart Handlers
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

  // Apply Coupon Handler
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponInput.trim().toUpperCase())
        .single();

      if (error || !data) {
        if (couponInput.trim().toUpperCase() === 'WELCOME50') {
          setAppliedCoupon({ code: 'WELCOME50', discount: 50 });
          setCouponError('');
        } else {
          setCouponError('Invalid Coupon Code');
        }
      } else {
        setAppliedCoupon({ code: data.code, discount: data.discount_amount || data.discount || 50 });
      }
    } catch (err) {
      setCouponError('Failed to apply coupon');
    }
  };

  const rawSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, rawSubtotal - discount);

  // Place Order Handler
  const handlePlaceOrder = async () => {
    if (!customerName || !phoneNumber) {
      alert('Please fill in Name and Phone Number!');
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
            order_type: orderType,
            status: 'Pending',
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsToInsert = cart.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      window.location.href = `/track/${orderData.id}`;
    } catch (err: any) {
      console.error('Order error:', err);
      alert('Failed to place order: ' + (err.message || 'Error'));
      setIsSubmitting(false);
    }
  };

  // Filter Logic combining Search, Category & Diet
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = searchQuery
      ? item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;

    const defaultIsVeg = !item.name?.toLowerCase().includes('chicken') && !item.name?.toLowerCase().includes('pepperoni');
    const isVeg = item.is_veg ?? defaultIsVeg;

    const matchesDiet =
      dietFilter === 'All' ||
      (dietFilter === 'Veg' && isVeg) ||
      (dietFilter === 'Non-Veg' && !isVeg);

    return matchesSearch && matchesCategory && matchesDiet;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <main className="flex-1 p-6 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Munch Menu</h1>

        {/* Phase 3 - Order Type Selection (Dine-in / Takeaway / Delivery) */}
        <div className="mb-6 flex gap-3">
          {(['Dine-in', 'Takeaway', 'Delivery'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                orderType === type
                  ? 'bg-amber-800 text-white border-amber-800'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {type === 'Dine-in' ? '🍽️ Dine-in' : type === 'Takeaway' ? '🛍️ Takeaway' : '🛵 Delivery'}
            </button>
          ))}
        </div>

        {/* Search & Diet Filters */}
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

          <div className="flex bg-gray-200 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDietFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition ${dietFilter === 'All' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
            >
              All
            </button>
            <button
              onClick={() => setDietFilter('Veg')}
              className={`px-3 py-1.5 rounded-lg transition ${dietFilter === 'Veg' ? 'bg-green-600 text-white' : 'text-gray-500'}`}
            >
              🟢 Veg
            </button>
            <button
              onClick={() => setDietFilter('Non-Veg')}
              className={`px-3 py-1.5 rounded-lg transition ${dietFilter === 'Non-Veg' ? 'bg-red-600 text-white' : 'text-gray-500'}`}
            >
              🔴 Non-Veg
            </button>
          </div>
        </div>

        {/* Phase 3 - Categories Bar */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Menu Grid */}
        {loading ? (
          <div className="text-center py-10 font-bold text-gray-500">Loading food menu...</div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border text-gray-400 text-sm">
            No food items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMenuItems.map((item) => {
              const imageUrl = item.image_url || defaultImages[item.name] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';

              return (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-base">{item.name}</h3>
                    <p className="text-xs text-gray-400 my-1 line-clamp-1">{item.description || 'Tasty delight'}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-gray-800">₹{item.price}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-amber-800 hover:bg-amber-900 text-white px-4 py-1.5 rounded-xl font-bold text-xs transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {cart.length > 0 && (
        <aside className="w-full md:w-80 bg-white p-6 border-l border-gray-200 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">Your Cart</h2>
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">₹{item.price} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg">
                    <button onClick={() => updateQuantity(item.id, -1)} className="font-bold px-1 text-gray-600 hover:text-black">-</button>
                    <span className="font-bold text-xs">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="font-bold px-1 text-gray-600 hover:text-black">+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Details Form */}
            <div className="mt-4 pt-4 border-t space-y-3">
              <input
                type="text"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-amber-800"
              />
              <input
                type="text"
                placeholder="Enter mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-amber-800"
              />
            </div>

            {/* Coupon Code Section */}
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs font-bold text-gray-700 mb-2">Have a Coupon?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 border rounded-xl px-3 py-1.5 text-xs uppercase focus:outline-amber-800"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-amber-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-amber-900"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-green-600 font-bold mt-1.5">
                  ✓ '{appliedCoupon.code}' Applied (₹{appliedCoupon.discount} Off)
                </p>
              )}
              {couponError && (
                <p className="text-xs text-red-500 font-semibold mt-1.5">{couponError}</p>
              )}
            </div>
          </div>

          {/* Pricing & Checkout */}
          <div className="mt-6 pt-4 border-t">
            {appliedCoupon && (
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Discount:</span>
                <span className="text-green-600 font-semibold">-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 mb-4">
              <span>Total Amount:</span>
              <span className="text-green-600">₹{finalTotal}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 rounded-xl shadow-md text-sm transition"
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}