import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, searchAddresses } from '@/lib/services/geocoding';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const mode = searchParams.get('mode') || 'search';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  if (mode === 'geocode') {
    const result = await geocodeAddress(query);
    return NextResponse.json(result);
  }

  // Default: search mode - return suggestions
  const suggestions = await searchAddresses(query);
  return NextResponse.json({ suggestions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const result = await geocodeAddress(address);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 });
  }
}
