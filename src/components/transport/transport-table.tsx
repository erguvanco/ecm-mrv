'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
} from '@/components/ui';
import { Truck } from 'lucide-react';
import { TRANSPORT_FUEL_TYPES } from '@/lib/validations/transport';

interface TransportEvent {
  id: string;
  date: string;
  vehicleId: string | null;
  vehicleDescription: string | null;
  distanceKm: number;
  fuelType: string | null;
  fuelAmount: number | null;
  cargoDescription: string | null;
  feedstockDelivery?: { id: string; date: string; feedstockType: string } | null;
  sequestrationEvent?: { id: string; finalDeliveryDate: string } | null;
  evidence?: Array<{ id: string }>;
}

interface TransportTableProps {
  transportEvents: TransportEvent[];
}

export function TransportTable({ transportEvents }: TransportTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getFuelTypeLabel = (value: string | null) => {
    if (!value) return '-';
    return TRANSPORT_FUEL_TYPES.find((t) => t.value === value)?.label || value;
  };

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
      <div className="border bg-[var(--card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Fuel</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transportEvents.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer hover:bg-[var(--muted)]"
                onClick={() => router.push(`/transport/${event.id}`)}
              >
                <TableCell className="font-medium">
                  {format(new Date(event.date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>{event.distanceKm} km</TableCell>
                <TableCell>
                  {event.vehicleId || event.vehicleDescription || '-'}
                </TableCell>
                <TableCell>
                  {event.fuelType ? (
                    <Badge variant="secondary">
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
