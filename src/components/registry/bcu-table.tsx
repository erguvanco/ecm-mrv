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
import { Award } from 'lucide-react';
import { BCU_STATUSES } from '@/lib/validations/bcu';
import { useTableSort } from '@/hooks/use-table-sort';
import { formatDateTime } from '@/lib/utils';

interface BCU {
  id: string;
  registrySerialNumber: string;
  quantityTonnesCO2e: number;
  issuanceDate: string | Date;
  status: string;
  ownerName: string | null;
  retirementDate: string | Date | null;
  retirementBeneficiary: string | null;
  sequestrationEvents?: Array<{
    sequestration: {
      id: string;
      finalDeliveryDate: string | Date;
      sequestrationType: string;
    };
  }>;
}

interface BCUTableProps {
  bcus: BCU[];
}

export function BCUTable({ bcus }: BCUTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'issued':
        return 'default';
      case 'transferred':
        return 'outline';
      case 'retired':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // Filter BCUs
  const filteredData = useMemo(() => {
    return bcus.filter((bcu) => {
      const matchesSearch = searchQuery === '' ||
        bcu.registrySerialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bcu.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bcu.retirementBeneficiary?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === '' || bcu.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bcus, searchQuery, statusFilter]);

  // Sorting
  const { sortedData, sortConfig, handleSort } = useTableSort(filteredData, {
    key: 'issuanceDate',
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
      const response = await fetch(`/api/registry/${deleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete BCU');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (bcus.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No BCUs issued yet"
        description="Issue Biochar Carbon Units from completed sequestration events to create tradeable carbon credits."
        action={{ label: 'Issue BCU', href: '/registry/issue' }}
      />
    );
  }

  return (
    <>
      <TableToolbar
        searchPlaceholder="Search BCUs..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'status',
            label: 'All Statuses',
            options: BCU_STATUSES.map((s) => ({ value: s.value, label: s.label })),
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
                sortKey="registrySerialNumber"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Serial Number
              </SortableTableHead>
              <SortableTableHead
                sortKey="quantityTonnesCO2e"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Quantity
              </SortableTableHead>
              <SortableTableHead
                sortKey="issuanceDate"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Issued
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Status
              </SortableTableHead>
              <SortableTableHead
                sortKey="ownerName"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Owner
              </SortableTableHead>
              <SortableTableHead
                sortKey="retirementBeneficiary"
                currentSortKey={sortConfig?.key as string}
                sortDirection={sortConfig?.direction ?? null}
                onSort={handleSort}
              >
                Beneficiary
              </SortableTableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-[var(--muted-foreground)]">
                  No BCUs match your search criteria
                </TableCell>
              </TableRow>
            ) : paginatedData.map((bcu) => (
              <TableRow
                key={bcu.id}
                className="cursor-pointer hover:bg-[var(--muted)]"
                onClick={() => router.push(`/registry/${bcu.id}`)}
              >
                <TableCell className="font-mono text-[var(--muted-foreground)]">
                  {bcu.registrySerialNumber}
                </TableCell>
                <TableCell>
                  {bcu.quantityTonnesCO2e.toFixed(2)} tCO2e
                </TableCell>
                <TableCell>
                  {formatDateTime(bcu.issuanceDate)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(bcu.status)} className="whitespace-nowrap">
                    {BCU_STATUSES.find((s) => s.value === bcu.status)?.label ||
                      bcu.status}
                  </Badge>
                </TableCell>
                <TableCell>{bcu.ownerName || '-'}</TableCell>
                <TableCell>
                  {bcu.status === 'retired'
                    ? bcu.retirementBeneficiary || '-'
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/registry/${bcu.id}`);
                      }}
                    >
                      View
                    </Button>
                    {bcu.status === 'issued' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(bcu.id);
                        }}
                      >
                        Delete
                      </Button>
                    )}
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
            <DialogTitle>Delete BCU</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this BCU? This action cannot be
              undone. Note: You can only delete BCUs that have not been
              transferred or retired.
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
