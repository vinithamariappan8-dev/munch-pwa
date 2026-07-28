"use client";

import React from "react";
import { X, Trash2, ArrowRight } from "lucide-react";

interface CartModalProps {
  cartItems: any[];
  onClose: () => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export default function CartModal({
  cartItems,
  onClose,
  onClearCart,
  onProceedToCheckout,
}: CartModalProps) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.totalPrice),
    0
  );
  const tax = subtotal * 0.08; // 8% Tax
  const grandTotal = subtotal + tax;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-extrabold text-[#1A1A1A] text-lg">Your Order</h2>
            <p className="text-xs text-gray-500">{cartItems.length} items selected</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full text-[#1A1A1A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 font-medium text-sm">Your cart is empty!</p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start pb-3 border-b border-gray-100"
              >
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A]">
                    {item.quantity}x {item.name}
                  </h4>
                  <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                  {item.selectedToppings.length > 0 && (
                    <p className="text-xs text-gray-400">
                      Toppings: {item.selectedToppings.join(", ")}
                    </p>
                  )}
                </div>
                <span className="font-bold text-sm text-[#E0006C]">
                  ${item.totalPrice}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary & Action Button */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-[#FAF6F0] rounded-b-3xl border-t border-gray-200">
            <div className="space-y-1.5 text-xs text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-[#1A1A1A] pt-2 border-t">
                <span>Total</span>
                <span className="text-[#E0006C]">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full bg-[#E0006C] hover:bg-[#B80058] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-[#E0006C]/30 flex justify-center items-center gap-2"
            >
              <span>Checkout Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}