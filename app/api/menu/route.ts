import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Environment variables missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) {
      return NextResponse.json({ success: false, error: catError.message }, { status: 500 });
    }

    // 2. Fetch menu items
    const { data: menuItems, error: itemError } = await supabase
      .from('menu_items')
      .select('*');

    if (itemError) {
      return NextResponse.json({ success: false, error: itemError.message }, { status: 500 });
    }

    // 3. Map items into categories manually
    const data = categories.map((cat) => ({
      ...cat,
      menu_items: menuItems.filter((item) => item.category_id === cat.id),
    }));

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}