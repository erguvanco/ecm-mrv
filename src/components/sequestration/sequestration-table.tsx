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
import { TreePine } from 'lucide-react';
import { SEQUESTRATION_TYPES } from '@/lib/validations/sequestration';
import { useTableSort } from '@/hooks/use-table-sort';
import { formatDateTime } from '@/lib/utils';

interface SequestrationEvent {
  id: string;
  finalDeliveryDate: string | Date;
  sequestrationType: string;
  deliveryPostcode: string;
  storageBeforeDelivery: boolean;
  status: string;
  wizardStep: number;
  quantityTonnes: number;
  batches: Array<{
    sequestrationId: string;
    productionBatchId: string;
    quantityTonnes: number;
    productionBatch: {
      id: string;
      productionDate: string | Date;
    };
  }>;
  evidence?: Array<{ id: string }>;
  _count?: {
    bcuEvents: number;
  };
}

interface SequestrationTableProps {
  events: SequestrationEvent[];
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'complete', label: 'Complete' },
];

export function SequestrationTable({ events }: SequestrationTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const getTypeLabel = (value: string) => {
    return SEQUESTRATION_TYPES.find((t) => t.value === value)?.label || value;
  };

  // Filter events
  const filteredData = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = searchQuery === '' ||
        event.deliveryPostcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTypeLabel(event.sequestrationType).toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDateTime(event.finalDeliveryDate).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === '' || event.sequestrationType === typeFilter;
      const matchesStatus = statusFilter === '' || event.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [events, searchQuery, typeFilter, statusFilter]);

  // Sorting
  const { sortedData, sortConfig, handleSort } = useTableSort(filteredData, {
    key: 'finalDeliveryDate',
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
      const response = await fetch(`/api/sequestration/${deleteId}`, {
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

  if (events.length === 0) {
    return (
      <EmptyState
        icon={TreePine}
        title="No sequestration events yet"
        description="Record where biochar is stored or applied to track permanent carbon removal."
        action={{ label: 'Create Sequestration Event', href: '/sequestration/new' }}
      />
    );
  }

  return (
    <>
      <TableToolbar
        searchPlaceholder="Search sequestration events..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'type',
            label: 'All Types',
            options: SEQUESTRATION_TYPES.map((t) => ({ value: t.value, label: t.label })),
            value: typeFilter,
            onChange: setTypeFilter,
          },
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
                sortKey="finalDeliveryDate"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Delivery Date
              </SortableTableHead>
              <SortableTableHead
                sortKey="sequestrationType"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Type
              </SortableTableHead>
              <SortableTableHead
                sortKey="quantityTonnes"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Quantity
              </SortableTableHead>
              <SortableTableHead
                sortKey="deliveryPostcode"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Postcode
              </SortableTableHead>
              <TableHead>Storage</TableHead>
              <SortableTableHead
                sortKey="status"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Status
              </SortableTableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-[var(--muted-foreground)]">
                  No sequestration events match your search criteria
                </TableCell>
              </TableRow>
            ) : paginatedData.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer hover:bg-[var(--muted)]"
                onClick={() => router.push(`/sequestration/${event.id}`)}
              >
                <TableCell>
                  {formatDateTime(event.finalDeliveryDate)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {getTypeLabel(event.sequestrationType)}
                  </Badge>
                </TableCell>
                <TableCell>{event.quantityTonnes.toFixed(2)} t</TableCell>
                <TableCell>{event.deliveryPostcode}</TableCell>
                <TableCell>
                  {event.storageBeforeDelivery ? (
                    <Badge variant="outline">Yes</Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {event.status === 'complete' ? (
                    <Badge variant="default">Complete</Badge>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Progress value={(event.wizardStep / 6) * 100} className="w-14 h-1.5" />
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {event.wizardStep}/6
                      </span>
                    </div>
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
                        if (event.status === 'draft') {
                          router.push(`/sequestration/${event.id}/wizard`);
                        } else {
                          router.push(`/sequestration/${event.id}`);
                        }
                      }}
                    >
                      {event.status === 'draft' ? 'Continue' : 'View'}
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
            <DialogTitle>Delete Sequestration Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sequestration event? This
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
