import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { total_amount, items, customer_name, phone_number } = await request.json();

    // 1. Orders டேபிளில் Customer వివరங்களுடன் சேர்த்தல்
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ 
        total_amount, 
        status: 'pending',
        customer_name,
        phone_number
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Order Items டேபிளில் சேர்ப்பது
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}