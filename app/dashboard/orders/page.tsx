'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: orders, error } = await supabase
      .from('merch_orders')
      .select(`
        *,
        products (
          name,
          price,
          images
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } else {
      setOrders(orders || []);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className='p-8'>Loading orders...</div>;
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-8'>My Orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <ShoppingBag className='h-12 w-12 text-zinc-400 mb-4' />
            <p className='text-zinc-400 text-lg mb-4'>No orders yet</p>
            <Button asChild>
              <a href='/merch'>Browse Merchandise</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>Order #{order.id.slice(0, 8)}</span>
                  <Badge
                    variant={
                      order.status === 'confirmed'
                        ? 'default'
                        : order.status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {order.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 relative'>
                    <img
                      src={order.products.images[0] || '/placeholder.svg'}
                      alt={order.products.name}
                      className='w-full h-full object-cover rounded'
                    />
                  </div>
                  <div>
                    <h3 className='font-semibold'>{order.products.name}</h3>
                    <p className='text-sm text-zinc-400'>
                      Quantity: {order.quantity}
                    </p>
                    <p className='text-sm text-zinc-400'>
                      Total: R{order.total_price}
                    </p>
                  </div>
                </div>
                <div className='text-sm text-zinc-400'>
                  <p>Ordered on: {format(new Date(order.created_at), 'PPP')}</p>
                  <p className='mt-2'>Delivery Address:</p>
                  <p>{order.delivery_address.street}</p>
                  <p>{order.delivery_address.suburb}</p>
                  <p>{order.delivery_address.city}, {order.delivery_address.province}</p>
                  <p>{order.delivery_address.postal_code}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}