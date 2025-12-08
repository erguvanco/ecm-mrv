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
  Progress,
  EmptyState,
  SortableTableHead,
  TableToolbar,
  Pagination,
  usePagination,
} from '@/components/ui';
import { Factory } from 'lucide-react';
import { useTableSort } from '@/hooks/use-table-sort';
import { formatDateTime } from '@/lib/utils';

interface ProductionBatch {
  id: string;
  serialNumber: number;
  productionDate: string | Date;
  inputFeedstockWeightTonnes: number;
  outputBiocharWeightTonnes: number;
  status: string;
  wizardStep: number;
  feedstockDelivery?: {
    id: string;
    serialNumber: number;
    date: string | Date;
    feedstockType: string;
  } | null;
  evidence?: Array<{ id: string }>;
  _count?: {
    sequestrationBatches: number;
    bcuBatches: number;
  };
}

interface ProductionTableProps {
  batches: ProductionBatch[];
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'complete', label: 'Complete' },
];

export function ProductionTable({ batches }: ProductionTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Helper to format display ID
  const formatDisplayId = (serialNumber: number) => `PB-${String(serialNumber).padStart(3, '0')}`;

  // Filter batches
  const filteredData = useMemo(() => {
    return batches.filter((batch) => {
      const displayId = formatDisplayId(batch.serialNumber);
      const matchesSearch = searchQuery === '' ||
        displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDateTime(batch.productionDate).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === '' || batch.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [batches, searchQuery, statusFilter]);

  // Sorting
  const { sortedData, sortConfig, handleSort } = useTableSort(filteredData, {
    key: 'productionDate',
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
      const response = await fetch(`/api/production/${deleteId}`, {
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

  if (batches.length === 0) {
    return (
      <EmptyState
        icon={Factory}
        title="No production batches yet"
        description="Create a batch to convert feedstock into biochar and track the pyrolysis process."
        action={{ label: 'Create First Batch', href: '/production/new' }}
      />
    );
  }

  return (
    <>
      <TableToolbar
        searchPlaceholder="Search batches..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'status',
            label: 'All Statuses',
            options: STATUS_OPTIONS,
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
      />
      <div className="border bg-[var(--card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                sortKey="serialNumber"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                ID
              </SortableTableHead>
              <SortableTableHead
                sortKey="productionDate"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Date
              </SortableTableHead>
              <SortableTableHead
                sortKey="inputFeedstockWeightTonnes"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Input
              </SortableTableHead>
              <SortableTableHead
                sortKey="outputBiocharWeightTonnes"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Output
              </SortableTableHead>
              <TableHead>Conversion</TableHead>
              <SortableTableHead
                sortKey="status"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Status
              </SortableTableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-[var(--muted-foreground)]">
                  No batches match your search criteria
                </TableCell>
              </TableRow>
            ) : paginatedData.map((batch) => {
              const conversionRate =
                batch.inputFeedstockWeightTonnes > 0
                  ? (batch.outputBiocharWeightTonnes /
                      batch.inputFeedstockWeightTonnes) *
                    100
                  : 0;

              return (
                <TableRow
                  key={batch.id}
                  className="cursor-pointer hover:bg-[var(--muted)]"
                  onClick={() => router.push(`/production/${batch.id}`)}
                >
                  <TableCell className="font-mono text-[var(--muted-foreground)]">
                    {formatDisplayId(batch.serialNumber)}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(batch.productionDate)}
                  </TableCell>
                  <TableCell>
                    {batch.inputFeedstockWeightTonnes.toFixed(2)} t
                  </TableCell>
                  <TableCell>
                    {batch.outputBiocharWeightTonnes.toFixed(2)} t
                  </TableCell>
                  <TableCell>{conversionRate.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        batch.status === 'complete' ? 'default' : 'secondary'
                      }
                    >
                      {batch.status === 'complete' ? 'Complete' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-28">
                    {batch.status === 'draft' ? (
                      <div className="flex items-center gap-1.5">
                        <Progress value={(batch.wizardStep / 5) * 100} className="h-1.5" />
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {batch.wizardStep}/5
                        </span>
                      </div>
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
                          if (batch.status === 'draft') {
                            router.push(`/production/${batch.id}/wizard`);
                          } else {
                            router.push(`/production/${batch.id}`);
                          }
                        }}
                      >
                        {batch.status === 'draft' ? 'Continue' : 'View'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(batch.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
            <DialogTitle>Delete Production Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this production batch? This action
              cannot be undone.
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
