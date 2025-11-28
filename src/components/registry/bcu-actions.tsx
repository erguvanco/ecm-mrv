'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Textarea,
  Spinner,
} from '@/components/ui';

interface BCUActionsProps {
  bcuId: string;
  status: string;
}

export function BCUActions({ bcuId, status }: BCUActionsProps) {
  const router = useRouter();
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isRetireOpen, setIsRetireOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transfer form state
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newAccountId, setNewAccountId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Retire form state
  const [retirementBeneficiary, setRetirementBeneficiary] = useState('');
  const [retireNotes, setRetireNotes] = useState('');

  const handleTransfer = async () => {
    if (!newOwnerName.trim()) {
      setError('New owner name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/registry/${bcuId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newOwnerName,
          newAccountId: newAccountId || null,
          notes: transferNotes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to transfer BCU');
      }

      setIsTransferOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetire = async () => {
    if (!retirementBeneficiary.trim()) {
      setError('Retirement beneficiary is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/registry/${bcuId}/retire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retirementBeneficiary,
          notes: retireNotes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to retire BCU');
      }

      setIsRetireOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'retired') {
    return null;
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setIsTransferOpen(true)}
        >
          Transfer
        </Button>
        <Button onClick={() => setIsRetireOpen(true)}>Retire</Button>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer BCU</DialogTitle>
            <DialogDescription>
              Transfer ownership of this BCU to a new owner.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newOwnerName">New Owner Name *</Label>
              <Input
                id="newOwnerName"
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                placeholder="Enter new owner name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newAccountId">Account ID</Label>
              <Input
                id="newAccountId"
                value={newAccountId}
                onChange={(e) => setNewAccountId(e.target.value)}
                placeholder="Optional registry account ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferNotes">Notes</Label>
              <Textarea
                id="transferNotes"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Optional transfer notes"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTransferOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Transferring...
                </>
              ) : (
                'Transfer BCU'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retire Dialog */}
      <Dialog open={isRetireOpen} onOpenChange={setIsRetireOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retire BCU</DialogTitle>
            <DialogDescription>
              Retire this BCU on behalf of a beneficiary. This action is
              permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="retirementBeneficiary">
                Retirement Beneficiary *
              </Label>
              <Input
                id="retirementBeneficiary"
                value={retirementBeneficiary}
                onChange={(e) => setRetirementBeneficiary(e.target.value)}
                placeholder="Enter beneficiary name or organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retireNotes">Notes</Label>
              <Textarea
                id="retireNotes"
                value={retireNotes}
                onChange={(e) => setRetireNotes(e.target.value)}
                placeholder="Optional retirement notes"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRetireOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRetire}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Retiring...
                </>
              ) : (
                'Retire BCU'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
