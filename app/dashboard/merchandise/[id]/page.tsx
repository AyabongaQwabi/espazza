'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/ImageUploader';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function EditProduct({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch product details. Please try again.',
          variant: 'destructive',
        });
        router.push('/dashboard/merchandise');
      } else if (data) {
        setProduct(data);
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id, router, supabase]);

  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from('products')
      .update(product)
      .eq('id', params.id);

    if (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Product updated successfully!',
      });
      router.push('/dashboard/merchandise');
    }
  }

  const handleImageUpload = (urls: string[]) => {
    setProduct((prev) => ({
      ...prev,
      images: [...prev.images, ...urls],
    }));
  };

  const removeImage = (indexToRemove: number) => {
    setProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  if (loading) {
    return <div className='p-4'>Loading product details...</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Edit Product</h1>
      <form onSubmit={handleUpdateProduct} className='space-y-4 max-w-xl'>
        <div>
          <Label htmlFor='name'>Product Name</Label>
          <Input
            id='name'
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            value={product.description}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor='price'>Price</Label>
          <Input
            id='price'
            type='number'
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor='category'>Category</Label>
          <Select
            value={product.category}
            onValueChange={(value) =>
              setProduct({ ...product, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='Select Category' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='clothing'>Clothing</SelectItem>
              <SelectItem value='accessories'>Accessories</SelectItem>
              <SelectItem value='digital'>Digital Downloads</SelectItem>
              <SelectItem value='other'>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor='stock'>Stock</Label>
          <Input
            id='stock'
            type='number'
            value={product.stock}
            onChange={(e) => setProduct({ ...product, stock: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Current Images</Label>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2'>
            {product.images.map((imageUrl, index) => (
              <div key={index} className='relative'>
                <Image
                  src={imageUrl || '/placeholder.svg'}
                  alt={`Product image ${index + 1}`}
                  width={200}
                  height={200}
                  className='rounded-lg object-cover w-full h-40'
                />
                <Button
                  variant='destructive'
                  size='sm'
                  className='absolute top-2 right-2'
                  onClick={() => removeImage(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label>Add New Images</Label>
          <ImageUploader onUploadComplete={handleImageUpload} maxSizeInMB={5} />
        </div>
        <Button type='submit'>Update Product</Button>
      </form>
    </div>
  );
}
