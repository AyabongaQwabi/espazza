import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import MerchPageClient from './MerchPageClient';

export async function generateMetadata({ params }): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies });
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('code', params.id)
    .single();

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }

  return {
    title: `${product.name} | eSpazza Merchandise`,
    description: product.description,
    openGraph: {
      title: `${product.name} | eSpazza Merchandise`,
      description: product.description,
      images: [product.images[0] || '/placeholder.svg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | eSpazza Merchandise`,
      description: product.description,
      images: [product.images[0] || '/placeholder.svg'],
    },
  };
}

export default async function MerchItemPage({ params }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: product } = await supabase
    .from('products')
    .select('*, product_categories(name)')
    .eq('code', params.id)
    .single();

  if (!product) {
    return <div>Product not found</div>;
  }

  return <MerchPageClient initialProduct={product} />;
}
