"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all orders placed by customers
  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/orders");
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-white rounded-xl border border-gray-200">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Kitchen Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Live Customer Orders</p>
            </div>
          </div>
          <span className="bg-[#E0006C]/10 text-[#E0006C] font-bold px-4 py-2 rounded-xl text-sm">
            Total Orders: {orders.length}
          </span>
        </div>

        {/* Orders List */}
        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading active orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders received yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#E0006C]">{order.id}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>

                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">Items:</p>
                    <ul className="text-sm text-gray-700 mt-1 list-disc list-inside">
                      {order.items?.map((item: any, idx: number) => (
                        <li key={idx}>
                          {item.name} x {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex md:flex-col justify-between items-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <div className="text-right">
                    <span className="text-xs text-gray-400">Total</span>
                    <p className="text-xl font-black text-gray-800">${order.totalAmount?.toFixed(2)}</p>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4" /> Complete Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}