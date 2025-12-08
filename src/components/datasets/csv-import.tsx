'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface CSVImportProps {
  onSuccess: () => void;
}

export function CSVImport({ onSuccess }: CSVImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipDuplicates', 'true');

      const response = await fetch('/api/datasets/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult({
        success: true,
        imported: data.imported,
        skipped: data.skipped,
        errors: data.errors,
      });

      if (data.imported > 0) {
        onSuccess();
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Import failed'],
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'name',
      'category',
      'unit',
      'year',
      'source',
      'region',
      'co2_factor',
      'ch4_factor',
      'n2o_factor',
      'total_co2e',
      'gwp_ch4',
      'gwp_n2o',
      'notes',
    ];

    const exampleRow = [
      'Grid Electricity UK',
      'electricity',
      'kgCO2e/kWh',
      '2024',
      'DEFRA',
      'UK',
      '0.207',
      '0.0001',
      '0.00001',
      '0.21233',
      '28',
      '265',
      'UK grid average',
    ];

    const csv = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emission_factors_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="csv-upload"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Importing...' : 'Import CSV'}
        </Button>
        <Button variant="ghost" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.success && result.errors.length === 0
              ? 'bg-green-50 border-green-200'
              : result.errors.length > 0
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {result.success && result.errors.length === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                {result.imported} factor{result.imported !== 1 ? 's' : ''} imported
                {result.skipped > 0 && `, ${result.skipped} skipped (duplicates)`}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="font-medium text-yellow-800">Errors:</p>
                  <ul className="list-disc list-inside text-yellow-700">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>... and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-[var(--muted-foreground)] flex items-start gap-2">
        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">CSV Format:</p>
          <p>Required columns: name, category, unit, year, source, total_co2e</p>
          <p>Optional columns: region, co2_factor, ch4_factor, n2o_factor, gwp_ch4, gwp_n2o, notes</p>
          <p className="mt-1">Categories: electricity, fuel, transport, feedstock, other</p>
          <p>Sources: IPCC, DEFRA, EPA, BEIS, GHG_Protocol, Custom</p>
        </div>
      </div>
    </div>
  );
}
