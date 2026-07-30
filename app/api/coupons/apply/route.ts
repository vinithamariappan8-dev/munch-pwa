import { NextResponse } from 'next/server';

const VALID_COUPONS: Record<string, number> = {
  'MUNCH50': 50,
  'WELCOME100': 100,
};

export async function POST(req: Request) {
  try {
    const { code, cartTotal } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Enter a coupon code' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const discountAmount = VALID_COUPONS[cleanCode];

    if (!discountAmount) {
      return NextResponse.json({ success: false, error: 'Invalid coupon code!' }, { status: 400 });
    }

    if (cartTotal < discountAmount) {
      return NextResponse.json({ 
        success: false, 
        error: `Min order value ₹${discountAmount} needed` 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      code: cleanCode,
      discount: discountAmount,
      message: `Saved ₹${discountAmount}!`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}