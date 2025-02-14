'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Users,
  Calendar,
  Package,
  MessageSquare,
  Mail,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalProducts: 0,
    unreadMessages: 0,
  });
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin/login');
      return;
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminData) {
      router.push('/admin/login');
    }
  }

  async function fetchData() {
    try {
      // Fetch stats
      const { data: usersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      const { data: eventsCount } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true });

      const { data: productsCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      const { data: unreadCount } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'unread');

      setStats({
        totalUsers: usersCount?.count || 0,
        totalEvents: eventsCount?.count || 0,
        totalProducts: productsCount?.count || 0,
        unreadMessages: unreadCount?.count || 0,
      });

      // Fetch recent contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setContacts(contactsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleContactStatus(id: string, status: 'read' | 'replied') {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setContacts(contacts.map(contact =>
        contact.id === id ? { ...contact, status } : contact
      ));

      toast({
        title: 'Success',
        description: `Message marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message status',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div className='p-8'>Loading dashboard...</div>;
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold text-white mb-8'>Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-lg font-medium'>Total Users</CardTitle>
            <Users className='h-5 w-5 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-lg font-medium'>Total Events</CardTitle>
            <Calendar className='h-5 w-5 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-lg font-medium'>Total Products</CardTitle>
            <Package className='h-5 w-5 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-lg font-medium'>Unread Messages</CardTitle>
            <MessageSquare className='h-5 w-5 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.unreadMessages}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contacts */}
      <Card className='bg-zinc-900 border-zinc-800'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Mail className='h-5 w-5' />
            Recent Contact Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    {format(new Date(contact.created_at), 'PPp')}
                  </TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell className='max-w-md truncate'>
                    {contact.message}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contact.status === 'replied'
                          ? 'default'
                          : contact.status === 'read'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleContactStatus(contact.id, 'read')}
                        disabled={contact.status !== 'unread'}
                      >
                        <CheckCircle className='h-4 w-4 mr-1' />
                        Mark Read
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleContactStatus(contact.id, 'replied')}
                        disabled={contact.status === 'replied'}
                      >
                        <Mail className='h-4 w-4 mr-1' />
                        Mark Replied
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}