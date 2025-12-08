'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
  TableToolbar,
  SortableTableHead,
} from '@/components/ui';
import { Leaf } from 'lucide-react';
import { FEEDSTOCK_TYPES } from '@/lib/validations/feedstock';
import { useTableSort } from '@/hooks/use-table-sort';

interface FeedstockDelivery {
  id: string;
  serialNumber: number;
  date: string | Date;
  feedstockType: string;
  weightTonnes: number | null;
  volumeM3: number | null;
  deliveryDistanceKm: number;
  vehicleId: string | null;
  sourceAddress: string | null;
  updatedAt: string | Date;
  _count?: {
    productionBatches: number;
    transportEvents: number;
  };
  evidence?: Array<{ id: string }>;
}

interface FeedstockTableProps {
  feedstocks: FeedstockDelivery[];
}

export function FeedstockTable({ feedstocks }: FeedstockTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const getFeedstockTypeLabel = (value: string) => {
    return (
      FEEDSTOCK_TYPES.find((t) => t.value === value)?.label || value
    );
  };

  // Helper to format display ID
  const formatDisplayId = (serialNumber: number) => `FD-${String(serialNumber).padStart(3, '0')}`;

  // Filter feedstocks based on search and type filter
  const filteredFeedstocks = useMemo(() => {
    return feedstocks.filter((feedstock) => {
      const displayId = formatDisplayId(feedstock.serialNumber);
      const matchesSearch = searchQuery === '' ||
        displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feedstock.vehicleId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getFeedstockTypeLabel(feedstock.feedstockType).toLowerCase().includes(searchQuery.toLowerCase()) ||
        format(new Date(feedstock.date), 'MMM d, yyyy').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === '' || feedstock.feedstockType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [feedstocks, searchQuery, typeFilter]);

  // Sorting
  const { sortedData, sortConfig, handleSort } = useTableSort(filteredFeedstocks, {
    key: 'date',
    direction: 'desc',
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/feedstock/${deleteId}`, {
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

  if (feedstocks.length === 0) {
    return (
      <EmptyState
        icon={Leaf}
        title="No feedstock deliveries yet"
        description="Track incoming biomass deliveries to start your biochar production chain."
        action={{ label: 'Add First Delivery', href: '/feedstock/new' }}
      />
    );
  }

  return (
    <>
      <TableToolbar
        searchPlaceholder="Search deliveries..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'type',
            label: 'All Types',
            options: FEEDSTOCK_TYPES.map((t) => ({ value: t.value, label: t.label })),
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
                sortKey="serialNumber"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                ID
              </SortableTableHead>
              <SortableTableHead
                sortKey="date"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Date
              </SortableTableHead>
              <SortableTableHead
                sortKey="feedstockType"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Type
              </SortableTableHead>
              <SortableTableHead
                sortKey="sourceAddress"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Location
              </SortableTableHead>
              <SortableTableHead
                sortKey="weightTonnes"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Weight
              </SortableTableHead>
              <SortableTableHead
                sortKey="volumeM3"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Volume
              </SortableTableHead>
              <SortableTableHead
                sortKey="deliveryDistanceKm"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Distance
              </SortableTableHead>
              <SortableTableHead
                sortKey="vehicleId"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Vehicle
              </SortableTableHead>
              <SortableTableHead
                sortKey="updatedAt"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Last Edited
              </SortableTableHead>
              <TableHead>Evidence</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-[var(--muted-foreground)]">
                  No deliveries match your search criteria
                </TableCell>
              </TableRow>
            ) : sortedData.map((feedstock) => (
              <TableRow
                key={feedstock.id}
                className="cursor-pointer hover:bg-[var(--muted)]"
                onClick={() => router.push(`/feedstock/${feedstock.id}`)}
              >
                <TableCell className="font-mono text-sm text-[var(--muted-foreground)]">
                  {formatDisplayId(feedstock.serialNumber)}
                </TableCell>
                <TableCell className="font-medium">
                  {format(new Date(feedstock.date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getFeedstockTypeLabel(feedstock.feedstockType)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={feedstock.sourceAddress || undefined}>
                  {feedstock.sourceAddress || '-'}
                </TableCell>
                <TableCell>
                  {feedstock.weightTonnes
                    ? `${feedstock.weightTonnes.toFixed(2)} t`
                    : '-'}
                </TableCell>
                <TableCell>
                  {feedstock.volumeM3
                    ? `${feedstock.volumeM3.toFixed(2)} m³`
                    : '-'}
                </TableCell>
                <TableCell>{feedstock.deliveryDistanceKm} km</TableCell>
                <TableCell>{feedstock.vehicleId || '-'}</TableCell>
                <TableCell className="text-[var(--muted-foreground)]">
                  {format(new Date(feedstock.updatedAt), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  {feedstock.evidence && feedstock.evidence.length > 0 ? (
                    <Badge variant="outline">
                      {feedstock.evidence.length} file
                      {feedstock.evidence.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/feedstock/${feedstock.id}/edit`);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(feedstock.id);
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
      {sortedData.length > 0 && (
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          Showing {sortedData.length} of {feedstocks.length} deliveries
        </p>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feedstock Delivery</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feedstock delivery? This
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
