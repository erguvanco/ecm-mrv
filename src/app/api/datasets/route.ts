import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { emissionFactorSchema } from '@/lib/validations/emission-factor';

// GET all emission factors
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const year = searchParams.get('year');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where: Record<string, unknown> = {};

    if (activeOnly) {
      where.isActive = true;
    }
    if (category) {
      where.category = category;
    }
    if (source) {
      where.source = source;
    }
    if (year) {
      where.year = parseInt(year);
    }

    const factors = await db.emissionFactor.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
        { year: 'desc' },
      ],
    });

    return NextResponse.json(factors);
  } catch (error) {
    console.error('Error fetching emission factors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emission factors' },
      { status: 500 }
    );
  }
}

// POST create new emission factor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = emissionFactorSchema.parse(body);

    const factor = await db.emissionFactor.create({
      data: validatedData,
    });

    return NextResponse.json(factor, { status: 201 });
  } catch (error) {
    console.error('Error creating emission factor:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'An emission factor with this name, year, and source already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create emission factor' },
      { status: 500 }
    );
  }
}
