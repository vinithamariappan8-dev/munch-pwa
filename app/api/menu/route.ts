import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch categories with menu items
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*, menu_items(*)');

    if (catError) {
      console.error('Category Error:', catError.message);
      return NextResponse.json({ success: false, error: catError.message }, { status: 500 });
    }

    // 2. Fetch all reviews safely
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*');

    // 3. Map average ratings to each menu item safely
    const formattedCategories = categories?.map((cat: any) => ({
      ...cat,
      menu_items: cat.menu_items?.map((item: any) => {
        // Find reviews matching this menu item (if menu_item_id exists) or overall reviews
        const itemReviews = reviews?.filter((r: any) => r.menu_item_id === item.id) || [];
        
        let avgRating: number | null = null;
        let totalReviews = 0;

        if (itemReviews.length > 0) {
          const total = itemReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
          avgRating = parseFloat((total / itemReviews.length).toFixed(1));
          totalReviews = itemReviews.length;
        } else if (reviews && reviews.length > 0) {
          // Fallback to overall store avg rating if specific item reviews aren't mapped
          const total = reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
          avgRating = parseFloat((total / reviews.length).toFixed(1));
          totalReviews = reviews.length;
        }

        return {
          ...item,
          avgRating,
          totalReviews,
        };
      }) || [],
    })) || [];

    return NextResponse.json({ success: true, data: formattedCategories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}