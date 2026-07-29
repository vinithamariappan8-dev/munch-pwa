import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Categories மற்றும் Menu Items இரண்டையும் தனித்தனியாக Fetch செய்கிறோம்
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');

    const { data: items, error: itemError } = await supabase
      .from('menu_items')
      .select('*');

    if (catError || itemError) {
      console.error('Supabase Error:', catError || itemError);
      return NextResponse.json({ 
        success: false, 
        error: (catError || itemError)?.message 
      }, { status: 500 });
    }

    // Categories உடன் அதற்குரிய Items-ஐ இணைக்கிறோம்
    const formattedData = categories.map((cat: any) => ({
      ...cat,
      menu_items: items.filter((item: any) => item.category_id === cat.id)
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}