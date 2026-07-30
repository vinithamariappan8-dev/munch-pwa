'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

interface Category {
  id: string;
  name: string;
  image_url: string;
  menu_items: MenuItem[];
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // User Contact Details State
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setCategories(json.data);
          setSelectedCategory(json.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching menu:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.id === item.id);
      if (existing) {
        return prevCart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Place Order with Customer Details

  const handlePlaceOrder = async () => {
  if (!customerName.trim() || !phoneNumber.trim()) {
    Swal.fire({
      title: 'Hold on a second! 🙈',
      text: 'Please enter your name and phone number so we know where to deliver!',
      icon: 'warning',
      confirmButtonText: 'Got it! 👍',
      confirmButtonColor: '#ff6b6b',
      background: '#fff5f5',
      customClass: {
        popup: 'rounded-3xl shadow-xl',
      }
    });
    return;
  }

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        total_amount: totalPrice,
        items: cart,
        customer_name: customerName,
        phone_number: phoneNumber,
      }),
    });

    const json = await res.json();

    if (json.success) {
      Swal.fire({
        title: 'Yummy choice! 🍕✨',
        text: `Your order has been placed successfully! Order ID: ${json.orderId}`,
        icon: 'success',
        confirmButtonText: 'Awesome! 😍',
        confirmButtonColor: '#ff6b6b',
        background: '#fff5f5',
        customClass: {
          popup: 'rounded-3xl shadow-xl',
        }
      });
      setCart([]);
      setCustomerName('');
      setPhoneNumber('');
      setIsCartOpen(false);
    } else {
      Swal.fire({
        title: 'Oopsie! 🥺',
        text: json.error || 'Failed to place order.',
        icon: 'error',
        confirmButtonColor: '#ff6b6b',
      });
    }
  } catch (err) {
    Swal.fire({
      title: 'Connection Error 😢',
      text: 'Something went wrong. Please try again!',
      icon: 'error',
      confirmButtonColor: '#ff6b6b',
    });
  }
};
  
  if (loading) return <div className="p-8 text-center text-xl font-medium">Loading Menu...</div>;

  const currentCategory = categories.find((cat) => cat.id === selectedCategory);

  return (
    <main className="p-6 max-w-5xl mx-auto pb-24 min-h-screen relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Munch Menu</h1>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold hover:bg-orange-200 transition"
        >
          🛒 Cart: {totalItems} items
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-8 justify-center">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              selectedCategory === cat.id
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Food Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentCategory?.menu_items?.map((item) => (
          <div key={item.id} className="border rounded-xl p-4 flex gap-4 shadow-sm bg-white items-center">
            <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-gray-500 text-sm mb-2">{item.description}</p>
              <div className="font-bold text-green-600">₹{item.price}</div>
            </div>
            <button
              onClick={() => addToCart(item)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 active:scale-95 transition"
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Floating Bar */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex justify-between items-center w-11/12 max-w-lg">
          <div>
            <p className="text-xs text-gray-400">{totalItems} ITEMS ADDED</p>
            <p className="text-lg font-bold">₹{totalPrice}</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl font-bold transition"
          >
            View Cart ➔
          </button>
        </div>
      )}

      {/* Cart Modal Slide-over */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 flex flex-col justify-between shadow-xl overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-4 border-b">
                <h2 className="text-2xl font-bold">Your Cart</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-500 hover:text-black font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Items List */}
              <div className="mt-4 flex flex-col gap-4 max-h-[35vh] overflow-y-auto border-b pb-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Your cart is empty!</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-500">₹{item.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="font-bold text-red-500 px-2"
                        >
                          -
                        </button>
                        <span className="font-semibold">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="font-bold text-green-600 px-2"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Info Form */}
              {cart.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-bold text-gray-700">Customer Details</h3>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border rounded-lg p-2 mt-1 focus:outline-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="Enter mobile number" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full border rounded-lg p-2 mt-1 focus:outline-orange-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Total & Checkout */}
            {cart.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{totalPrice}</span>
                </div>
                <button 
                  onClick={handlePlaceOrder}
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-orange-600 transition"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}