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
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Share2,
  Heart,
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Tag,
  Truck,
  Star,
} from 'lucide-react';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = process.env.NEXT_IKHOKA_APP_ID;
const APPLICATION_KEY = process.env.NEXT_PUBLIC_IKHOKA_APP_KEY;
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
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [wishlist, setWishlist] = useState([]);
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

    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
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
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You need to be logged in to make a purchase.',
        variant: 'destructive',
      });
      setPurchaseLoading(false);
      return;
    }
    try {
      const transactionId = short().toUUID(short.generate());
      const totalPrice = selectedProduct.price * orderDetails.quantity * 100; // Convert to cents
      const request = {
        entityID: selectedProduct.id,
        externalEntityID: selectedProduct.id,
        amount: totalPrice,
        currency: 'ZAR',
        requesterUrl: 'https://espazza.co.za/merch-store',
        description: `Purchase of ${orderDetails.quantity}x ${selectedProduct.name}`,
        paymentReference: `${currentUser.id}-${selectedProduct.id}`,
        mode: 'live',
        externalTransactionID: transactionId,
        urls: {
          callbackUrl: 'https://espazza.co.za/api/payment/callback',
          successPageUrl: `https://espazza.co.za/merch-store/success?transaction_id=${transactionId}`,
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
    const shareUrl = `${window.location.origin}/merch-store/${product.code}`;
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

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setProductModalOpen(true);
  };

  const nextImage = () => {
    if (selectedProduct?.images?.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === selectedProduct.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedProduct?.images?.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? selectedProduct.images.length - 1 : prevIndex - 1
      );
    }
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const newWishlist = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];

      // Save to localStorage
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));

      return newWishlist;
    });

    toast({
      title: wishlist.includes(productId)
        ? 'Removed from Wishlist'
        : 'Added to Wishlist',
      description: wishlist.includes(productId)
        ? 'Product has been removed from your wishlist'
        : 'Product has been added to your wishlist',
    });
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-white to-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-8 text-center'>
          <h1 className='text-4xl font-bold mb-2 text-primary'>
            eSpazza Merchandise
          </h1>
          <p className='text-muted-foreground max-w-2xl mx-auto'>
            Discover our exclusive collection of high-quality merchandise. From
            apparel to accessories, find something that matches your style.
          </p>
        </div>

        <div className='bg-white rounded-xl shadow-sm p-4 mb-8'>
          <div className='flex flex-col md:flex-row gap-4'>
            <form onSubmit={handleSearch} className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
              <Input
                type='text'
                placeholder='Search products...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10'
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
        </div>

        {loading ? (
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
          </div>
        ) : products.length === 0 ? (
          <div className='text-center p-12 bg-white rounded-xl shadow-sm'>
            <Info className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
            <h3 className='text-xl font-semibold mb-2'>No products found</h3>
            <p className='text-muted-foreground'>
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {products.map((product) => (
              <Card
                key={product.id}
                className='group overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-200 bg-gradient-to-br from-yellow-100 via-yellow-200 to-red-200'
              >
                <div className='relative overflow-hidden'>
                  {product.images && product.images.length > 0 ? (
                    <div className='relative h-64 overflow-hidden'>
                      <div className='absolute inset-0 flex transition-transform duration-500 ease-in-out transform group-hover:scale-110'>
                        <Image
                          src={product.images[0] || '/placeholder.svg'}
                          alt={product.name}
                          fill
                          className='object-cover'
                        />
                      </div>
                      <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300'></div>
                      <Button
                        variant='secondary'
                        size='sm'
                        className='absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                        onClick={() => openProductModal(product)}
                      >
                        Quick View
                      </Button>
                    </div>
                  ) : (
                    <div className='h-64 bg-gray-100 flex items-center justify-center'>
                      <p className='text-muted-foreground'>
                        No image available
                      </p>
                    </div>
                  )}
                  {product.stock < 10 && product.stock > 0 && (
                    <Badge className='absolute top-2 left-2 bg-amber-500'>
                      Only {product.stock} left
                    </Badge>
                  )}
                  {product.stock === 0 && (
                    <Badge className='absolute top-2 left-2 bg-red-500'>
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <CardContent className='pt-4 text-gray-800'>
                  <div className='flex justify-between items-start mb-2'>
                    <CardTitle className='text-lg line-clamp-1'>
                      {product.name}
                    </CardTitle>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-muted-foreground hover:text-red-500'
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          wishlist.includes(product.id)
                            ? 'fill-red-500 text-red-500'
                            : ''
                        }`}
                      />
                    </Button>
                  </div>
                  <Badge
                    variant='outline'
                    className='mb-2 bg-white/70 text-gray-800'
                  >
                    {product.product_categories.name}
                  </Badge>
                  <p className='text-sm text-muted-foreground line-clamp-2 mb-2'>
                    {product.description}
                  </p>
                  <div className='flex items-center mt-2'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className='h-4 w-4 fill-amber-400 text-amber-400'
                      />
                    ))}
                    <span className='text-xs text-muted-foreground ml-1'>
                      (5.0)
                    </span>
                  </div>
                </CardContent>
                <CardFooter className='flex justify-between items-center pt-0 text-gray-800'>
                  <span className='text-lg font-bold text-primary'>
                    R{product.price}
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      onClick={() => handleShare(product)}
                      variant='outline'
                      size='icon'
                      className='h-9 w-9'
                    >
                      <Share2 className='h-4 w-4' />
                    </Button>
                    <Button
                      onClick={() => handlePurchase(product)}
                      disabled={purchaseLoading || product.stock === 0}
                      className='flex items-center gap-1'
                    >
                      <ShoppingBag className='h-4 w-4' />
                      <span>Buy Now</span>
                    </Button>
                  </div>
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

        {/* Product Quick View Modal */}
        <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
          <DialogContent className='sm:max-w-[900px] p-0 overflow-hidden'>
            <div className='grid md:grid-cols-2 gap-0'>
              {/* Image Slider */}
              <div className='relative h-[300px] md:h-[500px] bg-gray-100'>
                {selectedProduct?.images?.length > 0 ? (
                  <>
                    <div className='relative h-full w-full'>
                      <Image
                        src={
                          selectedProduct.images[currentImageIndex] ||
                          '/placeholder.svg'
                        }
                        alt={selectedProduct.name}
                        fill
                        className='object-cover'
                      />
                    </div>

                    {/* Image Navigation */}
                    <div className='absolute inset-y-0 left-0 flex items-center'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 rounded-full bg-white/80 text-gray-800 ml-2'
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        <ChevronLeft className='h-5 w-5' />
                      </Button>
                    </div>
                    <div className='absolute inset-y-0 right-0 flex items-center'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 rounded-full bg-white/80 text-gray-800 mr-2'
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                      >
                        <ChevronRight className='h-5 w-5' />
                      </Button>
                    </div>

                    {/* Thumbnail Navigation */}
                    {selectedProduct.images.length > 1 && (
                      <div className='absolute bottom-4 left-0 right-0 flex justify-center gap-2'>
                        {selectedProduct.images.map((_, index) => (
                          <button
                            key={index}
                            className={`h-2 w-2 rounded-full ${
                              currentImageIndex === index
                                ? 'bg-primary'
                                : 'bg-white/60'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className='flex items-center justify-center h-full'>
                    <p className='text-muted-foreground'>No image available</p>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className='p-6 flex flex-col'>
                <DialogHeader>
                  <div className='flex justify-between items-start'>
                    <DialogTitle className='text-2xl font-bold'>
                      {selectedProduct?.name}
                    </DialogTitle>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-muted-foreground hover:text-red-500'
                      onClick={() =>
                        selectedProduct && toggleWishlist(selectedProduct.id)
                      }
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          selectedProduct &&
                          wishlist.includes(selectedProduct.id)
                            ? 'fill-red-500 text-red-500'
                            : ''
                        }`}
                      />
                    </Button>
                  </div>
                  <DialogDescription>
                    <Badge variant='outline' className='mt-2'>
                      {selectedProduct?.product_categories?.name}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue='details' className='mt-6'>
                  <TabsList className='grid w-full grid-cols-2'>
                    <TabsTrigger value='details'>Details</TabsTrigger>
                    <TabsTrigger value='shipping'>Shipping</TabsTrigger>
                  </TabsList>
                  <TabsContent value='details' className='space-y-4 mt-4'>
                    <div className='flex items-center gap-2 mb-4'>
                      <div className='flex'>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className='h-4 w-4 fill-amber-400 text-amber-400'
                          />
                        ))}
                      </div>
                      <span className='text-sm text-muted-foreground'>
                        (5.0)
                      </span>
                    </div>

                    <p className='text-muted-foreground'>
                      {selectedProduct?.description}
                    </p>

                    <div className='flex items-center gap-2 mt-4'>
                      <Tag className='h-4 w-4 text-muted-foreground' />
                      <span className='text-2xl font-bold text-primary'>
                        R{selectedProduct?.price}
                      </span>
                    </div>

                    {selectedProduct?.stock < 10 &&
                      selectedProduct?.stock > 0 && (
                        <p className='text-amber-500 text-sm'>
                          Only {selectedProduct.stock} items left in stock!
                        </p>
                      )}
                    {selectedProduct?.stock === 0 && (
                      <p className='text-red-500 text-sm'>
                        Currently out of stock
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value='shipping' className='space-y-4 mt-4'>
                    <div className='flex items-start gap-3'>
                      <Truck className='h-5 w-5 text-muted-foreground mt-0.5' />
                      <div>
                        <h4 className='font-medium'>Delivery Information</h4>
                        <p className='text-sm text-muted-foreground'>
                          Standard delivery: 3-5 business days
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3'>
                      <Info className='h-5 w-5 text-muted-foreground mt-0.5' />
                      <div>
                        <h4 className='font-medium'>Return Policy</h4>
                        <p className='text-sm text-muted-foreground'>
                          Returns accepted within 14 days of delivery
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className='mt-auto pt-6 flex flex-col gap-4'>
                  <div className='flex gap-2'>
                    <Button
                      className='flex-1 flex items-center gap-2'
                      onClick={() => {
                        setProductModalOpen(false);
                        handlePurchase(selectedProduct);
                      }}
                      disabled={selectedProduct?.stock === 0}
                    >
                      <ShoppingBag className='h-4 w-4' />
                      Buy Now
                    </Button>
                    <Button
                      variant='outline'
                      size='icon'
                      onClick={() =>
                        selectedProduct && handleShare(selectedProduct)
                      }
                    >
                      <Share2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
