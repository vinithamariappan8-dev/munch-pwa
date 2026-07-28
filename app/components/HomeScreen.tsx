"use client";

import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Heart, Plus } from "lucide-react";
import ItemModal from "./ItemModal";
import CartModal from "./CartModal";
import OrderTracking from "./OrderTracking";

const CATEGORIES = ["All", "Specialty Shakes", "Edible Dough", "Sundaes", "Craft Coffee"];

export default function HomeScreen() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch("/api/menu");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error("Failed to fetch menu, loading fallback:", error);
        setMenuItems([
          {
            id: "1",
            name: "The Dough Whole Jar",
            category: "Specialty Shakes",
            price: 16.99,
            image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop",
            description: "Cookie dough rim, chocolate drizzle, topped with a mini chocolate chip cookie setup."
          },
          {
            id: "2",
            name: "Unicorn Milkshake",
            category: "Specialty Shakes",
            price: 15.99,
            image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&auto=format&fit=crop",
            description: "Cotton candy drizzle, marshmallow cream, rainbow sprinkles."
          },
          {
            id: "3",
            name: "Edible Cookie Dough Scoop",
            category: "Edible Dough",
            price: 8.99,
            image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop",
            description: "Safe to eat raw cookie dough with chocolate chips."
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  const handleAddToCart = (customizedItem: any) => {
    setCartItems([...cartItems, customizedItem]);
    setSelectedItem(null);
  };

  // 🔥 Updated Checkout logic sending data to Backend API
  const handleCheckout = async () => {
    try {
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems,
          totalAmount: totalAmount,
          customerName: "Guest User",
        }),
      });

      setIsCartOpen(false);
      setIsTracking(true);
    } catch (error) {
      console.error("Failed to place order:", error);
    }
  };

  const filteredItems = selectedCategory === "All"
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (isTracking) {
    return <OrderTracking onBack={() => setIsTracking(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1A1A1A] pb-20">
      <header className="p-4 bg-white shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div>
          <p className="text-xs text-gray-500 font-medium">Delivering to</p>
          <h2 className="text-sm font-bold text-[#E0006C] flex items-center gap-1">
            The Yard - Downtown Branch
          </h2>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="p-2 bg-[#FAF6F0] rounded-full relative"
        >
          <ShoppingBag className="w-6 h-6 text-[#1A1A1A]" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#E0006C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {totalCartCount}
            </span>
          )}
        </button>
      </header>

      <div className="p-5">
        <h1 className="text-2xl font-black text-[#1A1A1A]">
          Craving Something <span className="text-[#E0006C]">Sweet?</span>
        </h1>
        <p className="text-sm text-gray-600 mt-1">Order over-the-top milkshakes & desserts!</p>

        <div className="mt-4 flex items-center bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search milkshakes, cookie dough..."
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="px-5 overflow-x-auto flex gap-3 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-[#E0006C] text-white shadow-md"
                : "bg-white text-[#1A1A1A] border border-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="p-5 grid grid-cols-1 gap-4">
        {loading ? (
          <p className="text-center text-sm text-gray-500 py-10">Loading tasty treats...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-10">No items found in this category.</p>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:border-[#E0006C]/40 transition-all"
            >
              <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover" />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-[#1A1A1A] text-base">{item.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="text-gray-300 hover:text-[#E0006C]"
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className="font-extrabold text-[#E0006C] text-base">${item.price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                    }}
                    className="bg-[#E0006C] text-white p-2 rounded-xl flex items-center gap-1 text-xs font-bold px-3 hover:bg-[#B80058]"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {isCartOpen && (
        <CartModal
          cartItems={cartItems}
          onClose={() => setIsCartOpen(false)}
          onClearCart={() => setCartItems([])}
          onProceedToCheckout={handleCheckout}
        />
      )}
    </div>
  );
}