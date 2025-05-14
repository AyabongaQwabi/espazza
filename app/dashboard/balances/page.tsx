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
import { DollarSign, Music, Search, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Earning {
  id: string;
  created_at: string;
  amount: number;
  percentage: number;
  status: string;
  type: string;
  purchase: {
    id: string;
    transaction_id: string;
    created_at: string;
    release: {
      id: string;
      title: string;
      cover_image_url: string;
    };
    user: {
      id: string;
      email: string;
    };
  };
}

export default function DashboardPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [paidEarnings, setPaidEarnings] = useState(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEarnings();
  }, []);

  async function fetchEarnings() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch earnings for the current user
      const { data: earningsData, error } = await supabase
        .from('earnings')
        .select(
          `
          *,
          purchase:purchases (
            id,
            transaction_id,
            created_at,
            release:releases (
              id,
              title,
              cover_image_url
            ),
            user:profiles (id, email)
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching earnings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load earnings data',
          variant: 'destructive',
        });
      } else {
        setEarnings(earningsData || []);
        calculateEarningsTotals(earningsData);
      }
    } catch (error) {
      console.error('Error in fetchEarnings:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function calculateEarningsTotals(earningsData: Earning[]) {
    const total = earningsData.reduce(
      (sum, earning) => sum + Number(earning.amount),
      0
    );
    setTotalEarnings(total);

    const pending = earningsData
      .filter((earning) => earning.status === 'pending')
      .reduce((sum, earning) => sum + Number(earning.amount), 0);
    setPendingEarnings(pending);

    const paid = earningsData
      .filter((earning) => earning.status === 'paid')
      .reduce((sum, earning) => sum + Number(earning.amount), 0);
    setPaidEarnings(paid);
  }

  const filteredEarnings = earnings.filter((earning) => {
    if (!earning.purchase?.release?.title) return false;
    return earning.purchase.release.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  const sortedEarnings = [...filteredEarnings].sort((a, b) => {
    if (sortOption === 'newest') {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortOption === 'oldest') {
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortOption === 'highest') {
      return Number(b.amount) - Number(a.amount);
    } else {
      return Number(a.amount) - Number(b.amount);
    }
  });

  if (loading) {
    return <div className='p-8'>Loading earnings data...</div>;
  }

  return (
    <div className='p-8'>
      <h1 className='text-3xl font-bold mb-8'>Earnings Dashboard</h1>

      <div className='grid gap-6 mb-8 md:grid-cols-3 xl:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Earnings
            </CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              R{totalEarnings.toFixed(2)}
            </div>
            <p className='text-xs text-muted-foreground'>Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Earnings
            </CardTitle>
            <Wallet className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              R{pendingEarnings.toFixed(2)}
            </div>
            <p className='text-xs text-muted-foreground'>Awaiting payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Paid Earnings</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>R{paidEarnings.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>Already paid out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Transactions
            </CardTitle>
            <Music className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{earnings.length}</div>
            <p className='text-xs text-muted-foreground'>Across all releases</p>
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

      {sortedEarnings.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Wallet className='h-12 w-12 text-zinc-400 mb-4' />
            <p className='text-zinc-400 text-lg mb-4'>No earnings yet</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Release</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEarnings.map((earning) => (
              <TableRow key={earning.id}>
                <TableCell>
                  <div className='flex items-center space-x-3'>
                    <img
                      src={
                        earning.purchase?.release?.cover_image_url ||
                        '/placeholder.svg'
                      }
                      alt={earning.purchase?.release?.title || 'Release'}
                      className='w-10 h-10 rounded-full'
                    />
                    <div>
                      <div className='font-bold'>
                        {earning.purchase?.release?.title || 'Unknown Release'}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {earning.type === 'artist'
                          ? 'Artist Earnings'
                          : 'System Fee'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {earning.purchase?.user?.email || 'Unknown'}
                </TableCell>
                <TableCell>
                  {format(new Date(earning.created_at), 'PPP')}
                </TableCell>
                <TableCell>R{Number(earning.amount).toFixed(2)}</TableCell>
                <TableCell>{earning.percentage}%</TableCell>
                <TableCell>
                  <Badge
                    variant={earning.status === 'paid' ? 'default' : 'outline'}
                    className={
                      earning.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : ''
                    }
                  >
                    {earning.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
