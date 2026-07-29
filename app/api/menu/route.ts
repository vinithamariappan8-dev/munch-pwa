import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Categories மற்றும் அதனோடு சேர்ந்த Menu Items இரண்டையும் பெறுகிறோம்
    const { data, error } = await supabase
      .from('categories')
      .select('*, menu_items(*)');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}