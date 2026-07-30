'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

export default function FavoritesPage() {
  const [favoriteItems, setFavoriteItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      try {
        // Fetch full menu from API
        const res = await fetch('/api/menu');
        const json = await res.json();

        if (json.success && json.data) {
          // Flatten all menu items across categories
          const allItems: MenuItem[] = json.data.flatMap((cat: Category) => cat.menu_items || []);

          // Get saved favorite IDs from localStorage
          const savedFavIds: string[] = JSON.parse(localStorage.getItem('munch_favorites') || '[]');

          // Filter items that match saved IDs
          const favs = allItems.filter((item) => savedFavIds.includes(item.id));
          setFavoriteItems(favs);
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, []);

  // Remove item from Favorites
  const removeFavorite = (itemId: string) => {
    const savedFavIds: string[] = JSON.parse(localStorage.getItem('munch_favorites') || '[]');
    const updatedFavIds = savedFavIds.filter((id) => id !== itemId);
    
    // Update local storage
    localStorage.setItem('munch_favorites', JSON.stringify(updatedFavIds));

    // Update UI state
    setFavoriteItems((prev) => prev.filter((item) => item.id !== itemId));

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Removed from Favorites',
      showConfirmButton: false,
      timer: 1500,
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-xl font-medium">Loading Favorites... ❤️</div>;
  }

  return (
    <main className="p-6 max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="text-gray-600 hover:text-black font-semibold text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition"
          >
            ← Back to Menu
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            My Favorites ❤️
          </h1>
        </div>
        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
          {favoriteItems.length} Saved Items
        </span>
      </div>

      {/* Empty State */}
      {favoriteItems.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Favorites Yet!</h2>
          <p className="text-gray-500 mb-6">You haven't saved any food items to your favorites list.</p>
          <Link
            href="/"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            Explore Menu & Save Items 🍕
          </Link>
        </div>
      ) : (
        /* Favorites Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favoriteItems.map((item) => (
            <div 
              key={item.id} 
              className="border rounded-2xl p-4 flex gap-4 shadow-sm bg-white items-center relative hover:shadow-md transition"
            >
              <img 
                src={item.image_url} 
                alt={item.name} 
                className="w-24 h-24 object-cover rounded-xl" 
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                <p className="text-gray-500 text-sm mb-2 line-clamp-2">{item.description}</p>
                <div className="font-bold text-green-600 text-base">₹{item.price}</div>
              </div>

              <div className="flex flex-col items-center gap-3">
                {/* Remove Favorite Button */}
                <button
                  onClick={() => removeFavorite(item.id)}
                  className="text-2xl p-1 hover:scale-125 transition-transform active:scale-95"
                  title="Remove from favorites"
                >
                  ❤️
                </button>

                <Link
                  href="/"
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 active:scale-95 transition text-xs"
                >
                  Order Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}