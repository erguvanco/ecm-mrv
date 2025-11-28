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
import { Factory } from 'lucide-react';

interface ProductionBatch {
  id: string;
  productionDate: string;
  inputFeedstockWeightTonnes: number;
  outputBiocharWeightTonnes: number;
  status: string;
  wizardStep: number;
  feedstockDelivery?: {
    id: string;
    date: string;
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

export function ProductionTable({ batches }: ProductionTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      <div className="border bg-[var(--card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Input</TableHead>
              <TableHead>Output</TableHead>
              <TableHead>Conversion</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => {
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
                  <TableCell className="font-medium">
                    {format(new Date(batch.productionDate), 'MMM d, yyyy')}
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
                  <TableCell className="w-32">
                    {batch.status === 'draft' ? (
                      <div className="flex items-center gap-2">
                        <Progress value={(batch.wizardStep / 5) * 100} />
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {batch.wizardStep}/5
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)]">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
