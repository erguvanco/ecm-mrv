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
} from '@/components/ui';
import { Leaf } from 'lucide-react';
import { FEEDSTOCK_TYPES } from '@/lib/validations/feedstock';

interface FeedstockDelivery {
  id: string;
  date: string;
  feedstockType: string;
  weightTonnes: number | null;
  volumeM3: number | null;
  deliveryDistanceKm: number;
  vehicleId: string | null;
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

  // Filter feedstocks based on search and type filter
  const filteredFeedstocks = useMemo(() => {
    return feedstocks.filter((feedstock) => {
      const matchesSearch = searchQuery === '' ||
        feedstock.vehicleId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getFeedstockTypeLabel(feedstock.feedstockType).toLowerCase().includes(searchQuery.toLowerCase()) ||
        format(new Date(feedstock.date), 'MMM d, yyyy').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === '' || feedstock.feedstockType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [feedstocks, searchQuery, typeFilter]);

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
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeedstocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-[var(--muted-foreground)]">
                  No deliveries match your search criteria
                </TableCell>
              </TableRow>
            ) : filteredFeedstocks.map((feedstock) => (
              <TableRow
                key={feedstock.id}
                className="cursor-pointer hover:bg-[var(--muted)]"
                onClick={() => router.push(`/feedstock/${feedstock.id}`)}
              >
                <TableCell className="font-medium">
                  {format(new Date(feedstock.date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getFeedstockTypeLabel(feedstock.feedstockType)}
                  </Badge>
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
      {filteredFeedstocks.length > 0 && (
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          Showing {filteredFeedstocks.length} of {feedstocks.length} deliveries
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
