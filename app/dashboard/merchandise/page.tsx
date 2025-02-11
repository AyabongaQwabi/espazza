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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/ImageUploader';
import { toast } from '@/hooks/use-toast';

export default function MerchandiseManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [] as string[],
  });
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          ...newProduct,
          seller_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to create product. Please try again.',
        variant: 'destructive',
      });
    } else {
      setProducts([data[0], ...products]);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        images: [],
      });
      toast({
        title: 'Success',
        description: 'Product created successfully!',
      });
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete product. Please try again.',
          variant: 'destructive',
        });
      } else {
        setProducts(products.filter((product) => product.id !== productId));
        toast({
          title: 'Success',
          description: 'Product deleted successfully!',
        });
      }
    }
  }

  const handleImageUpload = (urls: string[]) => {
    setNewProduct((prev) => ({
      ...prev,
      images: urls,
    }));
  };

  if (loading) {
    return <div className='p-4'>Loading products...</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Merchandise Management</h1>

      <Dialog>
        <DialogTrigger asChild>
          <Button className='mb-4'>
            <Plus className='mr-2 h-4 w-4' /> Add New Product
          </Button>
        </DialogTrigger>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className='max-h-[70vh] overflow-y-auto pr-6'>
            <form onSubmit={handleCreateProduct} className='space-y-4'>
              <Input
                placeholder='Product Name'
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                required
              />
              <Textarea
                placeholder='Description'
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                required
              />
              <Input
                type='number'
                placeholder='Price'
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                required
              />
              <Select
                value={newProduct.category}
                onValueChange={(value) =>
                  setNewProduct({ ...newProduct, category: value })
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
              <Input
                type='number'
                placeholder='Stock'
                value={newProduct.stock}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, stock: e.target.value })
                }
                required
              />
              <div className='space-y-2'>
                <Label>Product Images</Label>
                <ImageUploader
                  onUploadComplete={(urls) =>
                    setNewProduct({ ...newProduct, images: urls })
                  }
                  maxSizeInMB={5}
                />
              </div>
              <Button type='submit'>Add Product</Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Images</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>${product.price}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>
                <div className='flex space-x-2'>
                  {product.images.map((imageUrl, index) => (
                    <Image
                      key={index}
                      src={imageUrl || '/placeholder.svg'}
                      alt={`${product.name} image ${index + 1}`}
                      width={50}
                      height={50}
                      className='object-cover rounded'
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant='outline'
                  size='sm'
                  className='mr-2'
                  onClick={() =>
                    router.push(`/dashboard/merchandise/${product.id}`)
                  }
                >
                  <Edit className='h-4 w-4 mr-1' /> Edit
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash className='h-4 w-4 mr-1' /> Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
