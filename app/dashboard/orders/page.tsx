'use client';

import type React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { OrderDetailsModal } from '@/components/OrderDetailsViewModal';

const ITEMS_PER_PAGE = 10;

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();
      if (!supabaseUser) throw new Error('User not found');

      setUser(supabaseUser);

      let query = supabase.from('orders').select(
        `
          *,
          products (
              *,
              seller:profiles!seller_id (id)
            ),
          profiles(id, artist_name)
        `,
        { count: 'exact' }
      );

      // Apply filters
      if (filterType === 'bought') {
        query = query.eq('user_id', supabaseUser.id);
      } else if (filterType === 'sold') {
        query = query.eq('purchases.products.seller.id', supabaseUser.id);
      }

      if (searchTerm) {
        query = query.or(
          `delivery_person.ilike.%${searchTerm}%,delivery_address.ilike.%${searchTerm}%,transaction_id.ilike.%${searchTerm}%`
        );
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE - 1;
      query = query
        .range(startIndex, endIndex)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      setOrders(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterType, searchTerm, supabase, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-8'>Orders Dashboard</h1>

      <div className='flex flex-col md:flex-row gap-4 mb-8'>
        <form onSubmit={handleSearch} className='flex-1'>
          <Input
            type='text'
            placeholder='Search orders...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full'
          />
        </form>
        <Select value={filterType} onValueChange={handleFilterChange}>
          <SelectTrigger className='w-full md:w-[180px]'>
            <SelectValue placeholder='Filter orders' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All orders</SelectItem>
            <SelectItem value='bought'>Orders I bought</SelectItem>
            <SelectItem value='sold'>Orders I sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className='text-center'>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className='text-center'>No orders found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delivery To</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const product = order.products;
              const isSold = product?.seller?.id === user?.id;
              return (
                <TableRow key={order.id}>
                  <TableCell>#{order.code?.toUpperCase()}</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{product?.name || 'N/A'}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    R{(order.total_amount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.delivery_person}</TableCell>
                  <TableCell>{isSold ? 'Sold' : 'Bought'}</TableCell>
                  <TableCell>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleViewDetails(order)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Pagination className='mt-8'>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => handlePageChange(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          order={selectedOrder}
          isSold={selectedOrder.products?.seller?.id === user?.id}
          onStatusUpdate={fetchOrders}
        />
      )}
    </div>
  );
}
