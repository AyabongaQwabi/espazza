'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Music, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Purchase {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  release: {
    id: string;
    title: string;
    cover_image_url: string;
    tracks: {
      id: string;
      title: string;
      url: string;
    }[];
  };
  user: {
    id: string;
    email: string;
  };
}

export default function DashboardPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPurchases();
  }, []);

  async function fetchPurchases() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: purchases, error } = await supabase
      .from('purchases')
      .select(
        `
        *,
        release:releases (
          id,
          title,
          cover_image_url,
          tracks (id, title, url)
        ),
        user:profiles (id, email)
      `
      )
      .eq('purchase_type', 'release')
      .eq('status', 'complete')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchases',
        variant: 'destructive',
      });
    } else {
      setPurchases(purchases || []);
      calculateTotalRevenue(purchases);
    }
    setLoading(false);
  }

  function calculateTotalRevenue(purchases: Purchase[]) {
    const total = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
    setTotalRevenue(total / 100); // Convert cents to dollars
  }

  const filteredPurchases = purchases.filter((purchase) =>
    purchase.release.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    if (sortOption === 'newest') {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortOption === 'oldest') {
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortOption === 'highest') {
      return b.amount - a.amount;
    } else {
      return a.amount - b.amount;
    }
  });

  if (loading) {
    return <div className='p-8'>Loading purchases...</div>;
  }

  return (
    <div className='p-8'>
      <h1 className='text-3xl font-bold mb-8'>Sales Dashboard</h1>

      <div className='grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>R{totalRevenue.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Sales</CardTitle>
            <Music className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{purchases.length}</div>
            <p className='text-xs text-muted-foreground'>
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='flex justify-between items-center mb-6'>
        <div className='relative w-64'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search releases...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>Newest First</SelectItem>
            <SelectItem value='oldest'>Oldest First</SelectItem>
            <SelectItem value='highest'>Highest Amount</SelectItem>
            <SelectItem value='lowest'>Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortedPurchases.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Music className='h-12 w-12 text-zinc-400 mb-4' />
            <p className='text-zinc-400 text-lg mb-4'>No purchases yet</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Release</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPurchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>
                  <div className='flex items-center space-x-3'>
                    <img
                      src={
                        purchase.release.cover_image_url || '/placeholder.svg'
                      }
                      alt={purchase.release.title}
                      className='w-10 h-10 rounded-full'
                    />
                    <div>
                      <div className='font-bold'>{purchase.release.title}</div>
                      <div className='text-sm text-gray-500'>
                        {purchase.release.tracks.length} tracks
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{purchase.user.email}</TableCell>
                <TableCell>
                  {format(new Date(purchase.created_at), 'PPP')}
                </TableCell>
                <TableCell>R{(purchase.amount / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant='outline'>{purchase.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
