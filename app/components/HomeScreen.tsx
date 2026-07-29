'use client';

import React, { useState, useEffect } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

interface HomeScreenProps {
  onAddToCart?: (item: MenuItem) => void;
}

export default function HomeScreen({ onAddToCart }: HomeScreenProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Specialty Shakes', 'Edible Dough', 'Sundaes', 'Craft Coffee'];

  // API-யில் இருந்து Menu Data-வை எடுக்கிறது
  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch('/api/menu');
        const data = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  // Category மற்றும் Search Query இரண்டையும் வச்சு Filter பண்ணும் லோஜிக்
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Delivering to</p>
        <h2 className="text-sm font-semibold text-pink-600">The Yard - Downtown Branch</h2>
      </div>

      {/* Main Banner Heading */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Craving Something <span className="text-pink-500">Sweet?</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Order over-the-top milkshakes & desserts!</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          🔍
        </div>
        <input
          type="text"
          placeholder="Search in milkshakes, cookie dough..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm text-gray-800"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
          >
            ❌
          </button>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-pink-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu Items List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Menu loading...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg font-medium">No items found!</p>
          <p className="text-xs text-gray-400 mt-1">
            Try searching for something else or change category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-xl bg-gray-100"
                />
                <div className="max-w-[200px] sm:max-w-xs">
                  <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                    {item.description}
                  </p>
                  <p className="text-sm font-bold text-pink-600 mt-2">${item.price.toFixed(2)}</p>
                </div>
              </div>

              <button
                onClick={() => onAddToCart && onAddToCart(item)}
                className="px-4 py-1.5 bg-pink-500 text-white text-xs font-semibold rounded-lg hover:bg-pink-600 transition-colors shadow-sm"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}