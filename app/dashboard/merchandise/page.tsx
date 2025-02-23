'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/SearchableSelect';
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
import { Plus, Edit, Trash, X } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/ImageUploader';
import { toast } from '@/hooks/use-toast';
import ShortUniqueId from 'short-unique-id';

export default function MerchandiseManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productCategories, setProductCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    product_category_id: '',
    stock: '',
    images: [] as string[],
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const uid = new ShortUniqueId({ length: 11 });

  useEffect(() => {
    const loadOptions = async () => {
      const { data: categoriesData } = await supabase
        .from('product_categories')
        .select('id, name');
      if (categoriesData) setProductCategories(categoriesData);
    };
    loadOptions();
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
      .select('*, category:product_categories(name)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  async function handleSubmitProduct(e: React.FormEvent) {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const productData = {
      name: newProduct.name,
      code: uid.rnd(),
      description: newProduct.description,
      price: newProduct.price,
      product_category_id: newProduct.product_category_id,
      stock: newProduct.stock,
      images: newProduct.images,
      seller_id: user.id,
    };

    let result;
    if (newProduct.id) {
      // Update existing product
      result = await supabase
        .from('products')
        .update(productData)
        .eq('id', newProduct.id)
        .select();
    } else {
      // Create new product
      result = await supabase.from('products').insert([productData]).select();
    }

    const { data, error } = result;

    if (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product. Please try again.',
        variant: 'destructive',
      });
    } else {
      // Fetch the updated product with category information
      const { data: updatedProduct, error: fetchError } = await supabase
        .from('products')
        .select('*, category:product_categories(name)')
        .eq('id', data[0].id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated product:', fetchError);
      } else {
        if (newProduct.id) {
          setProducts(
            products.map((p) =>
              p.id === updatedProduct.id ? updatedProduct : p
            )
          );
        } else {
          setProducts([updatedProduct, ...products]);
        }
        resetForm();
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: `Product ${
            newProduct.id ? 'updated' : 'created'
          } successfully!`,
        });
      }
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
      images: [...prev.images, ...urls],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleCreateNewProductCategory = async (name: string) => {
    const { data, error } = await supabase
      .from('product_categories')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error('Error creating product category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new category. Please try again.',
        variant: 'destructive',
      });
      return null;
    }

    setProductCategories((prev) => [...prev, data]);
    return data.id;
  };

  const handleEditProduct = (product) => {
    setNewProduct({
      id: product.id,
      code: ShortUniqueId(),
      name: product.name,
      description: product.description,
      price: product.price,
      product_category_id: product.product_category_id,
      stock: product.stock,
      images: product.images,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setNewProduct({
      id: '',
      name: '',
      description: '',
      price: '',
      product_category_id: '',
      stock: '',
      images: [],
    });
  };

  if (loading) {
    return <div className='p-4'>Loading products...</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Merchandise Management</h1>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className='mb-4' onClick={resetForm}>
            <Plus className='mr-2 h-4 w-4' /> Add New Product
          </Button>
        </DialogTrigger>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[625px]'>
          <DialogHeader>
            <DialogTitle>
              {newProduct.id ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <div className='max-h-[70vh] overflow-y-auto pr-6'>
            <form
              onSubmit={handleSubmitProduct}
              className='grid grid-cols-2 gap-4'
            >
              <div className='col-span-2'>
                <Label htmlFor='name'>Product Name</Label>
                <Input
                  id='name'
                  placeholder='Product Name'
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className='col-span-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  placeholder='Description'
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor='price'>Price</Label>
                <Input
                  id='price'
                  type='number'
                  placeholder='Price'
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor='stock'>Stock</Label>
                <Input
                  id='stock'
                  type='number'
                  placeholder='Stock'
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: e.target.value })
                  }
                  required
                />
              </div>
              <div className='col-span-2'>
                <Label htmlFor='category'>Category</Label>
                <SearchableSelect
                  id='category'
                  name='category'
                  displayName='Category'
                  value={newProduct.product_category_id}
                  onChange={(value) => {
                    setNewProduct((prev) => ({
                      ...prev,
                      product_category_id: value,
                    }));
                  }}
                  onCreateNew={handleCreateNewProductCategory}
                  options={productCategories}
                  placeholder='Select or create a category'
                />
              </div>
              <div className='col-span-2'>
                <Label>Product Images</Label>
                <div className='grid grid-cols-3 gap-2 mb-2'>
                  {newProduct.images.map((imageUrl, index) => (
                    <div key={index} className='relative'>
                      <Image
                        src={imageUrl || '/placeholder.svg'}
                        alt={`Product image ${index + 1}`}
                        width={100}
                        height={100}
                        className='object-cover rounded'
                      />
                      <Button
                        variant='destructive'
                        size='icon'
                        className='absolute top-0 right-0 h-6 w-6'
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
                <ImageUploader
                  onUploadComplete={handleImageUpload}
                  maxSizeInMB={5}
                />
              </div>
              <Button type='submit' className='col-span-2'>
                {newProduct.id ? 'Update Product' : 'Add Product'}
              </Button>
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
              <TableCell>{product.category?.name}</TableCell>
              <TableCell>R{product.price}</TableCell>
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
                  onClick={() => handleEditProduct(product)}
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
