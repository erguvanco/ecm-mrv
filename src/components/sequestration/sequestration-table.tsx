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
  Progress,
  EmptyState,
} from '@/components/ui';
import { TreePine } from 'lucide-react';
import { SEQUESTRATION_TYPES } from '@/lib/validations/sequestration';

interface SequestrationEvent {
  id: string;
  finalDeliveryDate: string;
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
      productionDate: string;
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

export function SequestrationTable({ events }: SequestrationTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getTypeLabel = (value: string) => {
    return SEQUESTRATION_TYPES.find((t) => t.value === value)?.label || value;
  };

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
      <div className="border bg-[var(--card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Postcode</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer hover:bg-[var(--muted)]"
                onClick={() => router.push(`/sequestration/${event.id}`)}
              >
                <TableCell className="font-medium">
                  {format(new Date(event.finalDeliveryDate), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
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
                    <div className="flex items-center gap-2">
                      <Progress value={(event.wizardStep / 6) * 100} className="w-16" />
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {event.wizardStep}/6
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
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
