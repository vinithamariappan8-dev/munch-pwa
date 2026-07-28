"use client";

import React, { useState } from "react";
import { X, Plus, Minus, Check } from "lucide-react";

interface ItemModalProps {
  item: any;
  onClose: () => void;
  onAddToCart: (customizedItem: any) => void;
}

export default function ItemModal({ item, onClose, onAddToCart }: ItemModalProps) {
  const [selectedSize, setSelectedSize] = useState("Pint (16oz)");
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const SIZES = [
    { name: "Pint (16oz)", price: 0 },
    { name: "Jar Souvenir (24oz)", price: 3.50 }
  ];

  const TOPPINGS = [
    { name: "Extra Cookie Dough", price: 1.50 },
    { name: "Whipped Cream", price: 0.75 },
    { name: "Rainbow Sprinkles", price: 0.50 },
    { name: "Chocolate Drizzle", price: 0.75 }
  ];

  const toggleTopping = (name: string) => {
    if (selectedToppings.includes(name)) {
      setSelectedToppings(selectedToppings.filter((t) => t !== name));
    } else {
      setSelectedToppings([...selectedToppings, name]);
    }
  };

  const calculateTotal = () => {
    const sizeObj = SIZES.find((s) => s.name === selectedSize);
    const sizePrice = sizeObj ? sizeObj.price : 0;
    const toppingsPrice = selectedToppings.reduce((acc, curr) => {
      const top = TOPPINGS.find((t) => t.name === curr);
      return acc + (top ? top.price : 0);
    }, 0);

    return ((item.price + sizePrice + toppingsPrice) * quantity).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto pb-6">
        {/* Image & Close Button */}
        <div className="relative h-56 w-full">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-full text-brand-charcoal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <h2 className="text-xl font-extrabold text-[#1A1A1A]">{item.name}</h2>
          <p className="text-xs text-gray-500 mt-1">{item.description}</p>

          {/* Size Selection */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Choose Size</h3>
            <div className="space-y-2">
              {SIZES.map((size) => (
                <div
                  key={size.name}
                  onClick={() => setSelectedSize(size.name)}
                  className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                    selectedSize === size.name
                      ? "border-[#E0006C] bg-[#E0006C]/5 font-bold"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-xs">{size.name}</span>
                  <span className="text-xs font-semibold text-[#E0006C]">
                    {size.price > 0 ? `+$${size.price.toFixed(2)}` : "Included"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Extra Toppings */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Add Extra Toppings</h3>
            <div className="space-y-2">
              {TOPPINGS.map((top) => {
                const isSelected = selectedToppings.includes(top.name);
                return (
                  <div
                    key={top.name}
                    onClick={() => toggleTopping(top.name)}
                    className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#E0006C] bg-[#E0006C]/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center text-white ${isSelected ? 'bg-[#E0006C]' : 'border border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-xs font-medium">{top.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">+${top.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-lg bg-white shadow-sm text-gray-600"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-bold text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 rounded-lg bg-white shadow-sm text-gray-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onAddToCart({ ...item, selectedSize, selectedToppings, quantity, totalPrice: calculateTotal() })}
              className="flex-1 bg-[#E0006C] hover:bg-[#B80058] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-[#E0006C]/30 flex justify-between px-5 items-center"
            >
              <span>Add to Cart</span>
              <span>${calculateTotal()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}