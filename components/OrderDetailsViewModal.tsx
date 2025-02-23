'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  isSold: boolean;
  onStatusUpdate: () => void;
}

const ORDER_STATUSES = [
  'not-paid',
  'paid',
  'pending',
  'packing-order',
  'awaiting-courier',
  'in-transit',
  'delivered',
  'issue-with-delivery',
  'failed-delivery',
];

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  isSold,
  onStatusUpdate,
}: OrderDetailsModalProps) {
  const [status, setStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: 'The order status has been successfully updated.',
      });
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  console.log('status', status, order);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Order ID:</Label>
            <div className='col-span-3'>{order.id}</div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Order code:</Label>
            <div className='col-span-3'>#{order.code?.toUpperCase()}</div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Date:</Label>
            <div className='col-span-3'>
              {new Date(order.created_at).toLocaleString()}
            </div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Product:</Label>
            <div className='col-span-3'>{order.products?.name || 'N/A'}</div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Quantity:</Label>
            <div className='col-span-3'>{order.quantity}</div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Total Amount:</Label>
            <div className='col-span-3'>
              R{(order.total_amount / 100).toFixed(2)}
            </div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Status:</Label>
            <div className='col-span-3'>
              {isSold ? (
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger
                    className='w-full'
                    className={
                      status === 'not-paid'
                        ? 'bg-red-500'
                        : status === 'pending'
                        ? 'bg-orange-800'
                        : status === 'packing-order'
                        ? 'bg-yellow-500'
                        : status === 'awaiting-courier'
                        ? 'bg-yellow-500'
                        : status === 'in-transit'
                        ? 'bg-yellow-500'
                        : status === 'delivered' || status === 'paid'
                        ? 'bg-green-500'
                        : status === 'issue-with-delivery'
                        ? 'bg-red-500'
                        : 'bg-red-500'
                    }
                  >
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                order.status
              )}
            </div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Delivery To:</Label>
            <div className='col-span-3'>{order.delivery_person}</div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Ordered By:</Label>
            <div className='col-span-3'>{order.profiles.artist_name}</div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Address:</Label>
            <div className='col-span-3'>{order.delivery_address}</div>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Contact:</Label>
            <div className='col-span-3'>{order.delivery_contact_number}</div>
          </div>
          {order.delivery_notes && (
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right font-medium'>Notes:</Label>
              <div className='col-span-3'>{order.delivery_notes}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          {isSold && (
            <Button onClick={handleStatusUpdate} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          )}
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
