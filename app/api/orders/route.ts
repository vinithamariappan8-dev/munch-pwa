import { NextResponse } from "next/server";

let ORDERS: any[] = [];

export async function GET() {
  return NextResponse.json(ORDERS);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newOrder = {
      id: `ORD-${Date.now()}`,
      items: body.items || [],
      totalAmount: body.totalAmount || 0,
      customerName: body.customerName || "Guest Customer",
      address: body.address || "The Yard - Downtown Branch",
      status: "Preparing",
      createdAt: new Date().toISOString(),
    };

    ORDERS.unshift(newOrder);

    return NextResponse.json(
      { message: "Order placed successfully!", order: newOrder },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}