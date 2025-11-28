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
import { Award } from 'lucide-react';
import { BCU_STATUSES } from '@/lib/validations/bcu';

interface BCU {
  id: string;
  registrySerialNumber: string;
  quantityTonnesCO2e: number;
  issuanceDate: string;
  status: string;
  ownerName: string | null;
  retirementDate: string | null;
  retirementBeneficiary: string | null;
  sequestrationEvent?: {
    id: string;
    finalDeliveryDate: string;
    sequestrationType: string;
  } | null;
}

interface BCUTableProps {
  bcus: BCU[];
}

export function BCUTable({ bcus }: BCUTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      <div className="border bg-[var(--card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial Number</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bcus.map((bcu) => (
              <TableRow
                key={bcu.id}
                className="cursor-pointer hover:bg-[var(--muted)]"
                onClick={() => router.push(`/registry/${bcu.id}`)}
              >
                <TableCell className="font-mono text-sm">
                  {bcu.registrySerialNumber}
                </TableCell>
                <TableCell className="font-medium">
                  {bcu.quantityTonnesCO2e.toFixed(2)} tCO2e
                </TableCell>
                <TableCell>
                  {format(new Date(bcu.issuanceDate), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(bcu.status)}>
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
