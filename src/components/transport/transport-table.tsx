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
import { Truck } from 'lucide-react';
import { TRANSPORT_FUEL_TYPES } from '@/lib/validations/transport';
import { useTableSort } from '@/hooks/use-table-sort';
import { formatDateTime } from '@/lib/utils';

interface TransportEvent {
  id: string;
  date: string | Date;
  vehicleId: string | null;
  vehicleDescription: string | null;
  distanceKm: number;
  fuelType: string | null;
  fuelAmount: number | null;
  cargoDescription: string | null;
  feedstockDelivery?: { id: string; date: string | Date; feedstockType: string } | null;
  sequestrationEvent?: { id: string; finalDeliveryDate: string | Date } | null;
  evidence?: Array<{ id: string }>;
}

interface TransportTableProps {
  transportEvents: TransportEvent[];
}

export function TransportTable({ transportEvents }: TransportTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');

  const getFuelTypeLabel = (value: string | null) => {
    if (!value) return '-';
    return TRANSPORT_FUEL_TYPES.find((t) => t.value === value)?.label || value;
  };

  // Filter transport events
  const filteredData = useMemo(() => {
    return transportEvents.filter((event) => {
      const matchesSearch = searchQuery === '' ||
        event.vehicleId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.cargoDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDateTime(event.date).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFuel = fuelFilter === '' || event.fuelType === fuelFilter;

      return matchesSearch && matchesFuel;
    });
  }, [transportEvents, searchQuery, fuelFilter]);

  // Sorting
  const { sortedData, sortConfig, handleSort } = useTableSort(filteredData, {
    key: 'date',
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
      const response = await fetch(`/api/transport/${deleteId}`, {
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

  if (transportEvents.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="No transport events yet"
        description="Log transport activities to track fuel usage and emissions for your supply chain."
        action={{ label: 'Add Transport Event', href: '/transport/new' }}
      />
    );
  }

  return (
    <>
      <TableToolbar
        searchPlaceholder="Search transport events..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'fuel',
            label: 'All Fuel Types',
            options: TRANSPORT_FUEL_TYPES.map((t) => ({ value: t.value, label: t.label })),
            value: fuelFilter,
            onChange: setFuelFilter,
          },
        ]}
      />
      <div className="border bg-[var(--card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                sortKey="date"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Date
              </SortableTableHead>
              <SortableTableHead
                sortKey="distanceKm"
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
                sortKey="fuelType"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Fuel
              </SortableTableHead>
              <SortableTableHead
                sortKey="cargoDescription"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Cargo
              </SortableTableHead>
              <TableHead>Evidence</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-[var(--muted-foreground)]">
                  No transport events match your search criteria
                </TableCell>
              </TableRow>
            ) : paginatedData.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer hover:bg-[var(--muted)]"
                onClick={() => router.push(`/transport/${event.id}`)}
              >
                <TableCell>
                  {formatDateTime(event.date)}
                </TableCell>
                <TableCell>{event.distanceKm.toFixed(2)} km</TableCell>
                <TableCell>
                  {event.vehicleId || event.vehicleDescription || '-'}
                </TableCell>
                <TableCell>
                  {event.fuelType ? (
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {getFuelTypeLabel(event.fuelType)}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {event.cargoDescription || '-'}
                </TableCell>
                <TableCell>
                  {event.evidence && event.evidence.length > 0 ? (
                    <Badge variant="outline">
                      {event.evidence.length} file
                      {event.evidence.length > 1 ? 's' : ''}
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
                        router.push(`/transport/${event.id}/edit`);
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
                        setDeleteId(event.id);
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
            <DialogTitle>Delete Transport Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transport event? This action
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
