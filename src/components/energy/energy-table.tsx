'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Spinner,
  EmptyState,
  SortableTableHead,
  TableToolbar,
  Pagination,
  usePagination,
} from '@/components/ui';
import { Zap } from 'lucide-react';
import { ENERGY_SCOPES, ENERGY_TYPES, ENERGY_UNITS } from '@/lib/validations/energy';
import { useTableSort } from '@/hooks/use-table-sort';
import { formatDateTime, formatDateTimeShort } from '@/lib/utils';

interface EnergyUsage {
  id: string;
  scope: string;
  energyType: string;
  quantity: number;
  unit: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  productionBatch?: { id: string; productionDate: string | Date } | null;
  evidence?: Array<{ id: string }>;
}

interface EnergyTableProps {
  energyUsages: EnergyUsage[];
}

export function EnergyTable({ energyUsages }: EnergyTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const getScopeLabel = (value: string) => {
    return ENERGY_SCOPES.find((s) => s.value === value)?.label || value;
  };

  const getTypeLabel = (value: string) => {
    return ENERGY_TYPES.find((t) => t.value === value)?.label || value;
  };

  const getUnitLabel = (value: string) => {
    return ENERGY_UNITS.find((u) => u.value === value)?.label || value;
  };

  // Filter energy usages
  const filteredData = useMemo(() => {
    return energyUsages.filter((energy) => {
      const matchesSearch = searchQuery === '' ||
        getScopeLabel(energy.scope).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTypeLabel(energy.energyType).toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDateTime(energy.periodStart).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesScope = scopeFilter === '' || energy.scope === scopeFilter;
      const matchesType = typeFilter === '' || energy.energyType === typeFilter;

      return matchesSearch && matchesScope && matchesType;
    });
  }, [energyUsages, searchQuery, scopeFilter, typeFilter]);

  // Sorting
  const { sortedData, sortConfig, handleSort } = useTableSort(filteredData, {
    key: 'periodStart',
    direction: 'desc',
  });

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    onPageChange,
    onPageSizeChange,
  } = usePagination(sortedData.length, 10);

  // Paginated data
  const paginatedData = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/energy/${deleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (energyUsages.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="No energy records yet"
        description="Track energy usage for accurate Life Cycle Assessment calculations."
        action={{ label: 'Add Energy Record', href: '/energy/new' }}
      />
    );
  }

  return (
    <>
      <TableToolbar
        searchPlaceholder="Search energy records..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'scope',
            label: 'All Scopes',
            options: ENERGY_SCOPES.map((s) => ({ value: s.value, label: s.label })),
            value: scopeFilter,
            onChange: setScopeFilter,
          },
          {
            id: 'type',
            label: 'All Types',
            options: ENERGY_TYPES.map((t) => ({ value: t.value, label: t.label })),
            value: typeFilter,
            onChange: setTypeFilter,
          },
        ]}
      />
      <div className="border bg-[var(--card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                sortKey="periodStart"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Period
              </SortableTableHead>
              <SortableTableHead
                sortKey="scope"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Scope
              </SortableTableHead>
              <SortableTableHead
                sortKey="energyType"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Type
              </SortableTableHead>
              <SortableTableHead
                sortKey="quantity"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Quantity
              </SortableTableHead>
              <TableHead>Linked Batch</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-[var(--muted-foreground)]">
                  No energy records match your search criteria
                </TableCell>
              </TableRow>
            ) : paginatedData.map((energy) => (
              <TableRow
                key={energy.id}
                className="cursor-pointer hover:bg-[var(--muted)]"
                onClick={() => router.push(`/energy/${energy.id}`)}
              >
                <TableCell>
                  {formatDateTimeShort(energy.periodStart)} – {formatDateTime(energy.periodEnd)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="whitespace-nowrap">{getScopeLabel(energy.scope)}</Badge>
                </TableCell>
                <TableCell>{getTypeLabel(energy.energyType)}</TableCell>
                <TableCell>
                  {energy.quantity.toFixed(2)} {getUnitLabel(energy.unit)}
                </TableCell>
                <TableCell>
                  {energy.productionBatch ? (
                    <Badge variant="outline">
                      {formatDateTimeShort(energy.productionBatch.productionDate)}
                    </Badge>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {energy.evidence && energy.evidence.length > 0 ? (
                    <Badge variant="outline">
                      {energy.evidence.length} file
                      {energy.evidence.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/energy/${energy.id}/edit`);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(energy.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedData.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Energy Usage Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this energy usage record? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
