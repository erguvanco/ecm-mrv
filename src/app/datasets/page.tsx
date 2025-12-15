'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Plus,
  Pencil,
  Trash2,
  Database,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmissionFactorForm } from '@/components/datasets/emission-factor-form';
import { CSVImport } from '@/components/datasets/csv-import';
import { CATEGORIES, SOURCES, type EmissionFactorInput } from '@/lib/validations/emission-factor';
import { Spinner } from '@/components/ui';

interface EmissionFactor extends EmissionFactorInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export default function DatasetsPage() {
  const router = useRouter();
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingFactor, setEditingFactor] = useState<EmissionFactor | undefined>();

  const fetchFactors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      params.set('activeOnly', 'false');

      const response = await fetch(`/api/datasets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setFactors(data);
    } catch (error) {
      console.error('Error fetching factors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, [categoryFilter, sourceFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emission factor?')) return;

    try {
      const response = await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      fetchFactors();
    } catch (error) {
      console.error('Error deleting factor:', error);
      alert('Failed to delete emission factor');
    }
  };

  const handleEdit = (factor: EmissionFactor) => {
    setEditingFactor(factor);
    setShowFormDialog(true);
  };

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setEditingFactor(undefined);
    fetchFactors();
  };

  const handleFormCancel = () => {
    setShowFormDialog(false);
    setEditingFactor(undefined);
  };

  const filteredFactors = factors.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.region?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const getSourceLabel = (source: string) => {
    return SOURCES.find((s) => s.value === source)?.label || source;
  };

  // Stats
  const totalFactors = factors.length;
  const uniqueCategories = new Set(factors.map((f) => f.category)).size;
  const uniqueSources = new Set(factors.map((f) => f.source)).size;
  const latestYear = factors.length > 0 ? Math.max(...factors.map((f) => f.year)) : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Datasets</h1>
          <p className="text-[var(--muted-foreground)]">
            Manage custom emission factors for LCA calculations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            Import CSV
          </Button>
          <Button onClick={() => setShowFormDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Factor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--muted)]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalFactors}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Total Factors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--muted)]">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{uniqueCategories}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--muted)]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{uniqueSources}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--muted)]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{latestYear}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Latest Year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Search factors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-[180px] h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-[180px] h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="all">All Sources</option>
              {SOURCES.map((src) => (
                <option key={src.value} value={src.value}>
                  {src.label}
                </option>
              ))}
            </select>
            {(searchQuery || categoryFilter !== 'all' || sourceFilter !== 'all') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setSourceFilter('all');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredFactors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
              <p className="text-lg font-medium">No emission factors found</p>
              <p className="text-[var(--muted-foreground)] mb-4">
                {factors.length === 0
                  ? 'Add your first emission factor or import from CSV'
                  : 'Try adjusting your filters'}
              </p>
              {factors.length === 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                    Import CSV
                  </Button>
                  <Button onClick={() => setShowFormDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Factor
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">CO2e</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">CO2</TableHead>
                  <TableHead className="text-right">CH4</TableHead>
                  <TableHead className="text-right">N2O</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFactors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {factor.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(factor.category)}</Badge>
                    </TableCell>
                    <TableCell>{factor.year}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {factor.source === 'Custom' ? factor.sourceOther : getSourceLabel(factor.source)}
                      </span>
                    </TableCell>
                    <TableCell>{factor.region || '-'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {factor.totalCo2e.toFixed(6)}
                    </TableCell>
                    <TableCell className="text-[var(--muted-foreground)] text-sm">
                      {factor.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-[var(--muted-foreground)]">
                      {factor.co2Factor?.toFixed(6) || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-[var(--muted-foreground)]">
                      {factor.ch4Factor?.toFixed(6) || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-[var(--muted-foreground)]">
                      {factor.n2oFactor?.toFixed(6) || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(factor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(factor.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFactor ? 'Edit Emission Factor' : 'Add Emission Factor'}
            </DialogTitle>
          </DialogHeader>
          <EmissionFactorForm
            factor={editingFactor}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Emission Factors</DialogTitle>
          </DialogHeader>
          <CSVImport
            onSuccess={() => {
              setShowImportDialog(false);
              fetchFactors();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
