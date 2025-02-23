'use client';

import type React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
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
import { toast } from '@/hooks/use-toast';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';
import short from 'short-uuid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import {
  OrderDetailsModal,
  type OrderDetails,
} from '@/components/OrderDetailsModal';
import ShortUniqueId from 'short-unique-id';
import { Share2 } from 'lucide-react';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = 'IKF3SALX1F82BZ7IT6914BEGBEWQ55Y7';
const APPLICATION_KEY = 'DaNAI4IUXeHdZiliiDnrxwWYPm2AE1Al';
const ITEMS_PER_PAGE = 12;

export default function MerchPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const uid = new ShortUniqueId({ length: 10 });

  const supabase = createClientComponentClient();
  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, product_categories(name)', { count: 'exact' });

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
      query = query.eq('product_category_id', categoryFilter);
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
  }, [supabase, searchTerm, priceFilter, categoryFilter, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('product_categories')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
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

  function createPayloadToSign(urlPath: string, body = '') {
    try {
      const parsedUrl = url.parse(urlPath);
      const basePath = parsedUrl.path;
      if (!basePath) throw new Error('No basePath in url');
      const payload = basePath + body;
      return jsStringEscape(payload);
    } catch (error) {
      console.error('Error on createPayloadToSign:', error);
      return '';
    }
  }

  function jsStringEscape(str: string) {
    return str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  }

  async function handlePurchase(product) {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to purchase products',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setSelectedProduct(product);
    setIsOrderModalOpen(true);
  }

  async function processOrder(orderDetails: OrderDetails) {
    setPurchaseLoading(true);
    setIsOrderModalOpen(false);

    try {
      const transactionId = short().toUUID(short.generate());
      const totalPrice = selectedProduct.price * orderDetails.quantity * 100; // Convert to cents
      const request = {
        entityID: selectedProduct.id,
        externalEntityID: selectedProduct.id,
        amount: totalPrice,
        currency: 'ZAR',
        requesterUrl: 'https://espazza.co.za/merch',
        description: `Purchase of ${orderDetails.quantity}x ${selectedProduct.name}`,
        paymentReference: `${currentUser.id}-${selectedProduct.id}`,
        mode: 'sandbox',
        externalTransactionID: transactionId,
        urls: {
          callbackUrl: 'https://espazza.co.za/api/payment/callback',
          successPageUrl: `https://espazza.co.za/merch/success?transaction_id=${transactionId}`,
          failurePageUrl: 'https://espazza.co.za/failure',
          cancelUrl: 'https://espazza.co.za/cancel',
        },
      };

      const requestBody = JSON.stringify(request);
      const payloadToSign = createPayloadToSign(API_ENDPOINT, requestBody);
      const signature = crypto
        .HmacSHA256(payloadToSign, APPLICATION_KEY.trim())
        .toString(crypto.enc.Hex);

      const response = await axios.post('/api/payment', request);

      if (response.data?.paylinkUrl) {
        // Create purchase record
        const { error: purchaseError } = await supabase
          .from('product_purchases')
          .insert([
            {
              product_id: selectedProduct.id,
              user_id: currentUser.id,
              amount: totalPrice,
              transaction_id: transactionId,
              purchase_date: new Date(),
              status: 'pending',
            },
          ]);

        if (purchaseError) throw purchaseError;

        // Create order record
        const sixCharOrderCode = uid.rnd();
        const { error: orderError } = await supabase.from('orders').insert([
          {
            user_id: currentUser.id,
            product_id: selectedProduct.id,
            status: 'not-paid',
            total_amount: totalPrice,
            code: sixCharOrderCode,
            transaction_id: transactionId,
            delivery_address: orderDetails.delivery_address,
            delivery_person: orderDetails.delivery_person,
            delivery_notes: orderDetails.delivery_notes,
            delivery_contact_number: orderDetails.delivery_contact_number,
            quantity: orderDetails.quantity,
          },
        ]);

        if (orderError) throw orderError;

        window.location.href = response.data.paylinkUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPurchaseLoading(false);
    }
  }

  const handleShare = async (product) => {
    const shareUrl = `${window.location.origin}/merch/${product.code}`;
    const shareText = `Check out ${product.name} on eSpazza Merchandise!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({
        title: 'Link Copied',
        description: 'The product link has been copied to your clipboard.',
      });
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-8'>eSpazza Merchandise</h1>

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
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
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
                <p className='text-sm text-zinc-500 mb-2'>
                  {product.product_categories.name}
                </p>
                <p className='text-sm line-clamp-3'>{product.description}</p>
              </CardContent>
              <CardFooter className='flex justify-between items-center'>
                <span className='text-lg font-bold'>R{product.price}</span>
                <Button
                  onClick={() => handleShare(product)}
                  variant='outline'
                  size='icon'
                >
                  <Share2 className='h-4 w-4' />
                </Button>
                <Button
                  onClick={() => handlePurchase(product)}
                  disabled={purchaseLoading}
                >
                  {purchaseLoading ? 'Processing...' : 'Buy Now'}
                </Button>
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

      {purchaseLoading && <LoadingOverlay />}

      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={processOrder}
        productName={selectedProduct?.name || ''}
        productPrice={selectedProduct?.price || 0}
      />
    </div>
  );
}
