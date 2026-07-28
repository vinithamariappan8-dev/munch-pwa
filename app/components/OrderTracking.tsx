"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Utensils, Bike, MapPin, ArrowLeft, Phone } from "lucide-react";

interface OrderTrackingProps {
  onBack: () => void;
}

const STEPS = [
  { id: 1, title: "Order Confirmed", desc: "Your order has been received by The Yard", icon: CheckCircle2 },
  { id: 2, title: "Preparing Your Shake", desc: "Our chefs are crafting your sweet treats", icon: Utensils },
  { id: 3, title: "Out for Delivery", desc: "Rider is on the way to your location", icon: Bike },
  { id: 4, title: "Delivered", desc: "Enjoy your desserts!", icon: MapPin },
];

export default function OrderTracking({ onBack }: OrderTrackingProps) {
  const [currentStep, setCurrentStep] = useState(2);

  // Auto-progress demo step for UI test
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1A1A1A]">
      {/* Top Header */}
      <header className="p-4 bg-white shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
        </button>
        <div>
          <h1 className="font-extrabold text-base text-[#1A1A1A]">Track Order #MNCH-8902</h1>
          <p className="text-xs text-[#E0006C] font-semibold">Estimated Time: 20-25 mins</p>
        </div>
      </header>

      {/* Simulated Live Map Container */}
      <div className="p-4">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 relative overflow-hidden h-48 flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#E0006C] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#E0006C]/30 animate-pulse mb-2">
              <Bike className="w-8 h-8 text-white" />
            </div>
            <p className="font-bold text-xs text-[#1A1A1A]">Driver is picking up your order</p>
            <p className="text-[10px] text-gray-500 mt-0.5">The Yard - Downtown Branch</p>
          </div>
        </div>
      </div>

      {/* Delivery Driver Info Card */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop"
                alt="Rider"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1A1A1A]">Alex Rivera</h3>
              <p className="text-xs text-gray-500">Delivery Partner (★ 4.9)</p>
            </div>
          </div>
          <button className="p-3 bg-[#E0006C]/10 text-[#E0006C] rounded-xl font-bold flex items-center gap-1">
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Order Progress Timeline */}
      <div className="p-4 mt-2">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-sm text-[#1A1A1A] mb-4">Order Status</h2>

          <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isDone = step.id <= currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div key={step.id} className="flex gap-4 relative z-10 items-start">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isDone
                        ? "bg-[#E0006C] text-white shadow-md shadow-[#E0006C]/30"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h4
                      className={`font-bold text-sm ${
                        isCurrent ? "text-[#E0006C]" : isDone ? "text-[#1A1A1A]" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}