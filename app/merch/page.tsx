'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import Image from 'next/image';

const ITEMS_PER_PAGE = 12;

export default function MerchPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProducts();
  }, [currentPage]); //Corrected useEffect dependency array

  async function fetchProducts() {
    setLoading(true);
    let query = supabase.from('products').select('*', { count: 'exact' });

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    if (priceFilter && priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-');
      if (max) {
        query = query.gte('price', min).lte('price', max);
      } else {
        query = query.gte('price', min);
      }
    }

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    }
    setLoading(false);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handlePriceFilter = (value: string) => {
    setPriceFilter(value);
    setCurrentPage(1);
    fetchProducts();
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
    fetchProducts();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts();
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-8'>XHAP Merchandise</h1>

      <div className='flex flex-col md:flex-row gap-4 mb-8'>
        <form onSubmit={handleSearch} className='flex-1'>
          <Input
            type='text'
            placeholder='Search products...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full'
          />
        </form>
        <Select value={priceFilter} onValueChange={handlePriceFilter}>
          <SelectTrigger className='w-full md:w-[180px]'>
            <SelectValue placeholder='Filter by price' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All prices</SelectItem>
            <SelectItem value='0-100'>R0 - R100</SelectItem>
            <SelectItem value='101-250'>R101 - R250</SelectItem>
            <SelectItem value='251-500'>R251 - R500</SelectItem>
            <SelectItem value='501-1000'>R501 - R1000</SelectItem>
            <SelectItem value='1001-'>R1001+</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
          <SelectTrigger className='w-full md:w-[180px]'>
            <SelectValue placeholder='Filter by category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All categories</SelectItem>
            <SelectItem value='clothing'>Clothing</SelectItem>
            <SelectItem value='accessories'>Accessories</SelectItem>
            <SelectItem value='digital'>Digital Downloads</SelectItem>
            <SelectItem value='other'>Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className='text-center'>Loading products...</div>
      ) : products.length === 0 ? (
        <div className='text-center'>No products found.</div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {products.map((product) => (
            <Card key={product.id} className='flex flex-col'>
              <CardHeader>
                <Image
                  src={product.images[0] || '/placeholder.svg'}
                  alt={product.name}
                  width={300}
                  height={300}
                  className='w-full h-48 object-cover rounded-t-lg'
                />
              </CardHeader>
              <CardContent className='flex-grow'>
                <CardTitle className='text-lg mb-2'>{product.name}</CardTitle>
                <p className='text-sm text-gray-500 mb-2'>{product.category}</p>
                <p className='text-sm line-clamp-3'>{product.description}</p>
              </CardContent>
              <CardFooter className='flex justify-between items-center'>
                <span className='text-lg font-bold'>R{product.price}</span>
                <Button>Add to Cart</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
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
    </div>
  );
}
