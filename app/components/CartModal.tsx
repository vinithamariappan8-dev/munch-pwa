"use client";

import React, { useState } from "react";
import { X, Trash2, ArrowRight, Tag } from "lucide-react";

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
  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.totalPrice || 0),
    0
  );
  const tax = subtotal * 0.08; // 8% Tax
  const rawTotal = subtotal + tax;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, rawTotal - discountAmount);

  // Apply Coupon Handler
  const handleApplyCoupon = async () => {
    setCouponError("");
    setCouponSuccess("");

    if (!couponCode.trim()) {
      setCouponError("Please enter a promo code");
      return;
    }

    setIsApplying(true);

    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, cartTotal: rawTotal }),
      });

      const data = await res.json();

      if (data.success) {
        setAppliedCoupon({ code: data.code, discount: data.discount });
        setCouponSuccess(data.message);
        setCouponCode("");
      } else {
        setCouponError(data.error || "Invalid coupon");
      }
    } catch (err) {
      setCouponError("Failed to apply coupon");
    } finally {
      setIsApplying(false);
    }
  };

  // Remove Applied Coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess("");
    setCouponError("");
  };

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
            className="p-2 bg-gray-100 rounded-full text-[#1A1A1A] hover:bg-gray-200 transition"
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
                  {item.selectedSize && (
                    <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                  )}
                  {item.selectedToppings && item.selectedToppings.length > 0 && (
                    <p className="text-xs text-gray-400">
                      Toppings: {item.selectedToppings.join(", ")}
                    </p>
                  )}
                </div>
                <span className="font-bold text-sm text-[#E0006C]">
                  ₹{item.totalPrice}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary, Coupon & Action Button */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-[#FAF6F0] rounded-b-3xl border-t border-gray-200 space-y-4">
            
            {/* 🎟️ PROMO CODE / COUPON SECTION */}
            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#E0006C]" /> HAVE A PROMO CODE?
              </p>

              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. MUNCH50"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs uppercase flex-1 focus:outline-[#E0006C] font-semibold"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplying}
                    type="button"
                    className="bg-[#E0006C] text-white font-bold text-xs px-4 py-1.5 rounded-xl hover:bg-[#B80058] transition disabled:opacity-50"
                  >
                    {isApplying ? "..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center text-xs font-bold text-green-700 bg-green-50 p-2 rounded-xl border border-green-200">
                  <span>🎟️ Promo '{appliedCoupon.code}' Applied</span>
                  <div className="flex items-center gap-2">
                    <span>-₹{appliedCoupon.discount}</span>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700 text-[10px] underline ml-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {couponError && (
                <p className="text-red-500 text-[11px] mt-1.5 font-medium">{couponError}</p>
              )}
              {couponSuccess && !appliedCoupon && (
                <p className="text-green-600 text-[11px] mt-1.5 font-bold">{couponSuccess}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{appliedCoupon.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-extrabold text-sm text-[#1A1A1A] pt-2 border-t">
                <span>Total Payable</span>
                <span className="text-[#E0006C]">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={onProceedToCheckout}
              className="w-full bg-[#E0006C] hover:bg-[#B80058] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-[#E0006C]/30 flex justify-center items-center gap-2 transition"
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