import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js async params resolution
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    // 1. First try matching as Short ID / Prefix
    let { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(name, price))')
      .ilike('id', `${id}%`)
      .limit(1);

    // 2. If no result, fallback to fetching all and matching short ID
    if (!orders || orders.length === 0) {
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name, price))');
      
      const found = allOrders?.find((o) => o.id.startsWith(id));
      if (found) {
        orders = [found];
      }
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: orders[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}