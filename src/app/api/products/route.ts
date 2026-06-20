import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://fakestoreapi.com';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category');
    
    let url = `${BACKEND_URL}/products`;
    if (category && category !== 'all') {
      url = `${BACKEND_URL}/products/category/${category}`;
    }

    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
