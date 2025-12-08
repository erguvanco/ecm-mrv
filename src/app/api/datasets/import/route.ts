import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface CSVRow {
  name: string;
  category: string;
  unit: string;
  year: string;
  source: string;
  region?: string;
  co2_factor?: string;
  ch4_factor?: string;
  n2o_factor?: string;
  total_co2e: string;
  gwp_ch4?: string;
  gwp_n2o?: string;
  notes?: string;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index].trim();
    });

    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function validateCategory(category: string): string {
  const valid = ['electricity', 'fuel', 'transport', 'feedstock', 'other'];
  const normalized = category.toLowerCase();
  return valid.includes(normalized) ? normalized : 'other';
}

function validateSource(source: string): string {
  const valid = ['IPCC', 'DEFRA', 'EPA', 'BEIS', 'GHG_Protocol', 'Custom'];
  const normalized = source.toUpperCase();
  const found = valid.find(v => v.toUpperCase() === normalized || v === source);
  return found || 'Custom';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const skipDuplicates = formData.get('skipDuplicates') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'category', 'unit', 'year', 'source', 'total_co2e'];
    const missingFields = requiredFields.filter(f => !(f in rows[0]));
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for 1-indexed and header row

      try {
        const year = parseInt(row.year);
        const totalCo2e = parseFloat(row.total_co2e);

        if (isNaN(year) || year < 1990 || year > 2100) {
          results.errors.push(`Row ${rowNum}: Invalid year "${row.year}"`);
          continue;
        }

        if (isNaN(totalCo2e) || totalCo2e <= 0) {
          results.errors.push(`Row ${rowNum}: Invalid total_co2e "${row.total_co2e}"`);
          continue;
        }

        const data = {
          name: row.name,
          category: validateCategory(row.category),
          categoryOther: row.category.toLowerCase() === 'other' ? row.category : null,
          unit: row.unit,
          year,
          source: validateSource(row.source),
          sourceOther: validateSource(row.source) === 'Custom' ? row.source : null,
          region: row.region || null,
          co2Factor: row.co2_factor ? parseFloat(row.co2_factor) : null,
          ch4Factor: row.ch4_factor ? parseFloat(row.ch4_factor) : null,
          n2oFactor: row.n2o_factor ? parseFloat(row.n2o_factor) : null,
          totalCo2e,
          gwpCh4: row.gwp_ch4 ? parseFloat(row.gwp_ch4) : null,
          gwpN2o: row.gwp_n2o ? parseFloat(row.gwp_n2o) : null,
          notes: row.notes || null,
          isActive: true,
        };

        // Check for existing factor with same name, year, source
        const existing = await db.emissionFactor.findFirst({
          where: {
            name: data.name,
            year: data.year,
            source: data.source,
          },
        });

        if (existing) {
          if (skipDuplicates) {
            results.skipped++;
            continue;
          } else {
            // Update existing
            await db.emissionFactor.update({
              where: { id: existing.id },
              data,
            });
            results.imported++;
          }
        } else {
          await db.emissionFactor.create({ data });
          results.imported++;
        }
      } catch (error) {
        results.errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      ...results,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
