import type React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderDetails: OrderDetails) => void;
  productName: string;
  productPrice: number;
}

export interface OrderDetails {
  delivery_address: string;
  delivery_person: string;
  delivery_notes: string;
  delivery_contact_number: string;
  quantity: number;
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  onSubmit,
  productName,
  productPrice,
}: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    delivery_address: '',
    delivery_person: '',
    delivery_notes: '',
    delivery_contact_number: '',
    quantity: 1,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setOrderDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(orderDetails);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Order Details for {productName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='quantity' className='text-right'>
                Quantity
              </Label>
              <Input
                id='quantity'
                name='quantity'
                type='number'
                value={orderDetails.quantity}
                onChange={handleChange}
                className='col-span-3'
                min='1'
                required
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='delivery_person' className='text-right'>
                Recipient
              </Label>
              <Input
                id='delivery_person'
                name='delivery_person'
                value={orderDetails.delivery_person}
                onChange={handleChange}
                className='col-span-3'
                required
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='delivery_address' className='text-right'>
                Address
              </Label>
              <Textarea
                id='delivery_address'
                name='delivery_address'
                value={orderDetails.delivery_address}
                onChange={handleChange}
                className='col-span-3'
                required
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='delivery_contact_number' className='text-right'>
                Contact Number
              </Label>
              <Input
                id='delivery_contact_number'
                name='delivery_contact_number'
                value={orderDetails.delivery_contact_number}
                onChange={handleChange}
                className='col-span-3'
                required
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='delivery_notes' className='text-right'>
                Notes
              </Label>
              <Textarea
                id='delivery_notes'
                name='delivery_notes'
                value={orderDetails.delivery_notes}
                onChange={handleChange}
                className='col-span-3'
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={orderDetails.quantity < 1}>
              Proceed to Payment (R
              {(orderDetails.quantity * productPrice).toFixed(2)})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
