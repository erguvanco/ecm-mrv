import { NextResponse } from 'next/server';
import { recalculateAllRoutes } from '@/lib/services/routing';

export async function POST() {
  try {
    console.log('Starting route recalculation...');
    const result = await recalculateAllRoutes();
    console.log('Route recalculation complete:', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Route recalculation error:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate routes', details: String(error) },
      { status: 500 }
    );
  }
}
