'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Calendar,
  User,
} from 'lucide-react';
import { format } from 'date-fns';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author_id: string;
  created_at: string;
  published: boolean;
  featured_image: string;
  ai_score: number;
  category: string;
  is_paid: boolean;
  payment_date: string | null;
  payment_amount: number | null;
  payment_reference: string | null;
  author_name?: string;
  author_email?: string;
};

export default function BlogAdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 15;

  useEffect(() => {
    checkAdminStatus();
    fetchPosts();
  }, [statusFilter, paymentFilter, sortField, sortDirection, currentPage]);

  async function checkAdminStatus() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'You need to be logged in to access this page',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Set admin status but don't redirect
      setIsAdmin(profile?.is_admin === true);
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function fetchPosts() {
    try {
      setLoading(true);

      // First, get the total count for pagination
      let countQuery = supabase
        .from('blog_posts')
        .select('id', { count: 'exact' });

      // Apply filters to count query
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('published', statusFilter === 'published');
      }

      if (paymentFilter !== 'all') {
        countQuery = countQuery.eq('is_paid', paymentFilter === 'paid');
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;
      setTotalPosts(count || 0);

      // Then get the paginated data
      let query = supabase
        .from('blog_posts')
        .select(
          `
          *,
          profiles:author_id (
            full_name,
            email
          )
        `
        )
        .order(sortField, { ascending: sortDirection === 'asc' });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('published', statusFilter === 'published');
      }

      if (paymentFilter !== 'all') {
        query = query.eq('is_paid', paymentFilter === 'paid');
      }

      // Apply pagination
      const from = (currentPage - 1) * postsPerPage;
      const to = from + postsPerPage - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include author information
      const transformedData = data.map((post) => ({
        ...post,
        author_name: post.profiles?.full_name || 'Unknown',
        author_email: post.profiles?.email || 'No email',
      }));

      setPosts(transformedData);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error fetching posts',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function togglePaymentStatus(postId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          is_paid: !currentStatus,
          payment_date: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Payment status updated',
        description: `Post marked as ${!currentStatus ? 'paid' : 'unpaid'}`,
        variant: 'default',
      });

      // Update local state
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_paid: !currentStatus,
                payment_date: !currentStatus ? new Date().toISOString() : null,
              }
            : post
        )
      );
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error updating payment status',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function updatePaymentDetails(
    postId: string,
    amount: number,
    reference: string
  ) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          payment_amount: amount,
          payment_reference: reference,
        })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Payment details updated',
        description: 'Payment amount and reference have been saved',
        variant: 'default',
      });

      // Update local state
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                payment_amount: amount,
                payment_reference: reference,
              }
            : post
        )
      );
    } catch (error: any) {
      console.error('Error updating payment details:', error);
      toast({
        title: 'Error updating payment details',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  const filteredPosts = posts.filter((post) => {
    if (searchQuery.trim() === '') return true;

    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.author_name?.toLowerCase().includes(query) ||
      post.author_email?.toLowerCase().includes(query)
    );
  });

  function Pagination() {
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const startItem = (currentPage - 1) * postsPerPage + 1;
    const endItem = Math.min(currentPage * postsPerPage, totalPosts);

    return (
      <div className='flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 mt-4'>
        <div className='text-sm text-muted-foreground'>
          Showing <span className='font-medium'>{startItem}</span> to{' '}
          <span className='font-medium'>{endItem}</span> of{' '}
          <span className='font-medium'>{totalPosts}</span> posts
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className='flex items-center'>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size='sm'
                  className='w-9 h-9 mx-1'
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  function handlePageChange(newPage: number) {
    setCurrentPage(newPage);
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 py-8 px-4'>
      <Card className='max-w-7xl mx-auto'>
        <CardHeader>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <CardTitle className='text-2xl font-bold'>
                Blog Posts Admin
              </CardTitle>
              <CardDescription>
                Manage blog posts and payment status
                {!isAdmin && (
                  <span className='ml-2 text-yellow-500 font-medium'>
                    (View only mode - Admin privileges required to make changes)
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push('/dashboard/blog')}
              variant='outline'
            >
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900'>
              <Card className='w-full max-w-md'>
                <CardHeader>
                  <CardTitle className='text-center'>Loading...</CardTitle>
                  <CardDescription className='text-center'>
                    Please wait while we load the blog posts
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex justify-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary'></div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {!isAdmin && (
                <div className='bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-800 rounded-md p-3 mb-4'>
                  <div className='flex items-center'>
                    <AlertCircle className='h-4 w-4 text-yellow-800 dark:text-yellow-500 mr-2' />
                    <p className='text-sm text-yellow-800 dark:text-yellow-500'>
                      You are viewing this page in read-only mode. Admin
                      privileges are required to manage payment status.
                    </p>
                  </div>
                </div>
              )}
              <div className='space-y-6'>
                <div className='flex flex-col md:flex-row gap-4'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Search posts...'
                      className='pl-8'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className='flex flex-col sm:flex-row gap-2'>
                    <div className='flex items-center gap-2'>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className='w-[160px]'>
                          <SelectValue placeholder='Status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All Status</SelectItem>
                          <SelectItem value='published'>Published</SelectItem>
                          <SelectItem value='draft'>Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Select
                        value={paymentFilter}
                        onValueChange={setPaymentFilter}
                      >
                        <SelectTrigger className='w-[160px]'>
                          <SelectValue placeholder='Payment' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All Payments</SelectItem>
                          <SelectItem value='paid'>Paid</SelectItem>
                          <SelectItem value='unpaid'>Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[300px]'>
                          <button
                            className='flex items-center gap-1'
                            onClick={() => handleSort('title')}
                          >
                            Title
                            <ArrowUpDown className='h-3 w-3' />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className='flex items-center gap-1'
                            onClick={() => handleSort('author_id')}
                          >
                            Author
                            <ArrowUpDown className='h-3 w-3' />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className='flex items-center gap-1'
                            onClick={() => handleSort('created_at')}
                          >
                            Date
                            <ArrowUpDown className='h-3 w-3' />
                          </button>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>
                          <button
                            className='flex items-center gap-1'
                            onClick={() => handleSort('is_paid')}
                          >
                            Payment
                            <ArrowUpDown className='h-3 w-3' />
                          </button>
                        </TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className='h-24 text-center'>
                            <div className='flex justify-center'>
                              <div className='animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary'></div>
                            </div>
                            <div className='mt-2 text-sm text-muted-foreground'>
                              Loading posts...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredPosts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className='h-24 text-center'>
                            <div className='flex justify-center'>
                              <AlertCircle className='h-6 w-6 text-muted-foreground' />
                            </div>
                            <div className='mt-2 text-sm text-muted-foreground'>
                              No posts found
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className='font-medium'>
                              <div className='flex items-center gap-2'>
                                {post.featured_image && (
                                  <div className='h-10 w-10 rounded overflow-hidden flex-shrink-0'>
                                    <img
                                      src={
                                        post.featured_image ||
                                        '/placeholder.svg'
                                      }
                                      alt={post.title}
                                      className='h-full w-full object-cover'
                                    />
                                  </div>
                                )}
                                <div className='truncate max-w-[220px]'>
                                  {post.title}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <User className='h-4 w-4 text-muted-foreground' />
                                <span>{post.author_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <Calendar className='h-4 w-4 text-muted-foreground' />
                                <span>
                                  {format(
                                    new Date(post.created_at),
                                    'MMM dd, yyyy'
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {post.published ? (
                                <Badge
                                  variant='default'
                                  className='bg-green-600'
                                >
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant='outline'>Draft</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant='outline'
                                className={
                                  post.category === 'Quality Post (R80)'
                                    ? 'border-green-500 text-green-500'
                                    : post.category === 'Regular Post (R50)'
                                    ? 'border-yellow-500 text-yellow-500'
                                    : 'border-red-500 text-red-500'
                                }
                              >
                                {post.ai_score} - {post.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <Switch
                                  checked={post.is_paid}
                                  onCheckedChange={() =>
                                    togglePaymentStatus(post.id, post.is_paid)
                                  }
                                  id={`payment-switch-${post.id}`}
                                  disabled={!isAdmin}
                                />
                                <Label htmlFor={`payment-switch-${post.id}`}>
                                  {post.is_paid ? (
                                    <span className='text-green-500 flex items-center gap-1'>
                                      <CheckCircle2 className='h-4 w-4' />
                                      Paid
                                    </span>
                                  ) : (
                                    <span className='text-red-500 flex items-center gap-1'>
                                      <XCircle className='h-4 w-4' />
                                      Unpaid
                                    </span>
                                  )}
                                </Label>
                                {!isAdmin && post.is_paid && (
                                  <span className='text-xs text-muted-foreground ml-1'>
                                    (Admin only)
                                  </span>
                                )}
                              </div>
                              {post.is_paid && post.payment_date && (
                                <div className='text-xs text-muted-foreground mt-1'>
                                  {format(
                                    new Date(post.payment_date),
                                    'MMM dd, yyyy'
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className='text-right'>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    className='h-8 w-8 p-0'
                                  >
                                    <span className='sr-only'>Open menu</span>
                                    <MoreVertical className='h-4 w-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      window.open(
                                        `/blog/${post.slug}`,
                                        '_blank'
                                      )
                                    }
                                  >
                                    <Eye className='mr-2 h-4 w-4' />
                                    View Post
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/blog/edit/${post.id}`
                                      )
                                    }
                                  >
                                    <Edit className='mr-2 h-4 w-4' />
                                    Edit Post
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (!isAdmin) {
                                        toast({
                                          title: 'Admin only',
                                          description:
                                            'Only administrators can update payment details',
                                          variant: 'destructive',
                                        });
                                        return;
                                      }

                                      const amount = window.prompt(
                                        'Enter payment amount:',
                                        post.payment_amount?.toString() || ''
                                      );
                                      const reference = window.prompt(
                                        'Enter payment reference:',
                                        post.payment_reference || ''
                                      );

                                      if (amount && reference) {
                                        updatePaymentDetails(
                                          post.id,
                                          Number.parseFloat(amount),
                                          reference
                                        );
                                      }
                                    }}
                                    className={
                                      !isAdmin ? 'text-muted-foreground' : ''
                                    }
                                  >
                                    <DollarSign className='mr-2 h-4 w-4' />
                                    Update Payment Details
                                    {!isAdmin && (
                                      <span className='ml-2 text-xs'>
                                        (Admin only)
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className='text-red-600'
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          'Are you sure you want to delete this post? This action cannot be undone.'
                                        )
                                      ) {
                                        // Delete post logic here
                                      }
                                    }}
                                  >
                                    <Trash2 className='mr-2 h-4 w-4' />
                                    Delete Post
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {totalPosts > 0 && <Pagination />}
              </div>
              <div className='mt-6 flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Showing{' '}
                  {Math.min(1 + (currentPage - 1) * postsPerPage, totalPosts)}{' '}
                  to {Math.min(currentPage * postsPerPage, totalPosts)} of{' '}
                  {totalPosts} posts
                </div>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className='flex items-center space-x-1'>
                    {Array.from(
                      {
                        length: Math.min(
                          5,
                          Math.ceil(totalPosts / postsPerPage)
                        ),
                      },
                      (_, i) => {
                        // Calculate page numbers to show (centered around current page)
                        const totalPages = Math.ceil(totalPosts / postsPerPage);
                        let startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(startPage + 4, totalPages);

                        if (endPage - startPage < 4) {
                          startPage = Math.max(1, endPage - 4);
                        }

                        const pageNumber = startPage + i;
                        if (pageNumber > totalPages) return null;

                        return (
                          <Button
                            key={pageNumber}
                            variant={
                              pageNumber === currentPage ? 'default' : 'outline'
                            }
                            size='sm'
                            className='w-8 h-8 p-0'
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        );
                      }
                    )}
                    {Math.ceil(totalPosts / postsPerPage) > 5 &&
                      currentPage <
                        Math.ceil(totalPosts / postsPerPage) - 2 && (
                        <>
                          <span className='text-muted-foreground'>...</span>
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-8 h-8 p-0'
                            onClick={() =>
                              handlePageChange(
                                Math.ceil(totalPosts / postsPerPage)
                              )
                            }
                          >
                            {Math.ceil(totalPosts / postsPerPage)}
                          </Button>
                        </>
                      )}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      currentPage >= Math.ceil(totalPosts / postsPerPage)
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
