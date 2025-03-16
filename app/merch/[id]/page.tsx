import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Facebook, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PhotoGallery from './photo-gallery';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: merchandiser } = await supabase
    .from('merchandisers')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!merchandiser) {
    return {
      title: 'Merchandiser Not Found | eSpazza',
    };
  }

  return {
    title: `${merchandiser.name} | eSpazza Merchandisers`,
    description: merchandiser.description?.substring(0, 160),
  };
}

export default async function MerchandiserPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: merchandiser } = await supabase
    .from('merchandisers')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!merchandiser) {
    notFound();
  }

  // Get images
  const { data: imageData } = await supabase.storage
    .from('merchandiser-images')
    .list(merchandiser.id.toString());

  const images =
    imageData?.map(
      (img) =>
        supabase.storage
          .from('merchandiser-images')
          .getPublicUrl(`${merchandiser.id}/${img.name}`).data.publicUrl
    ) || [];

  return (
    <div className='container mx-auto px-4 py-12'>
      <div className='max-w-5xl mx-auto'>
        <Button variant='ghost' asChild className='mb-8'>
          <Link href='/merchandisers'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to all merchandisers
          </Link>
        </Button>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12'>
          <div className='space-y-6'>
            <PhotoGallery
              images={images}
              merchandiserName={merchandiser.name}
            />
          </div>

          <div className='space-y-6'>
            <div>
              <h1 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                {merchandiser.name}
              </h1>
              <p className='text-zinc-400 whitespace-pre-line'>
                {merchandiser.description}
              </p>
            </div>

            <div className='border-t border-zinc-800 pt-6'>
              <h2 className='text-xl font-semibold text-white mb-4'>
                Contact Information
              </h2>
              <div className='space-y-4'>
                <div className='flex items-start'>
                  <Mail className='h-5 w-5 text-red-500 mt-0.5 mr-3' />
                  <div>
                    <p className='text-zinc-400 text-sm'>Email</p>
                    <a
                      href={`mailto:${merchandiser.email}`}
                      className='text-white hover:text-red-400'
                    >
                      {merchandiser.email}
                    </a>
                  </div>
                </div>

                <div className='flex items-start'>
                  <Phone className='h-5 w-5 text-red-500 mt-0.5 mr-3' />
                  <div>
                    <p className='text-zinc-400 text-sm'>Phone</p>
                    <a
                      href={`tel:${merchandiser.contact_number}`}
                      className='text-white hover:text-red-400'
                    >
                      {merchandiser.contact_number}
                    </a>
                  </div>
                </div>

                {merchandiser.address && (
                  <div className='flex items-start'>
                    <MapPin className='h-5 w-5 text-red-500 mt-0.5 mr-3' />
                    <div>
                      <p className='text-zinc-400 text-sm'>Address</p>
                      <p className='text-white'>{merchandiser.address}</p>
                    </div>
                  </div>
                )}

                {merchandiser.facebook_page && (
                  <div className='flex items-start'>
                    <Facebook className='h-5 w-5 text-red-500 mt-0.5 mr-3' />
                    <div>
                      <p className='text-zinc-400 text-sm'>Facebook</p>
                      <a
                        href={merchandiser.facebook_page}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-white hover:text-red-400'
                      >
                        Visit Facebook Page
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='pt-4'>
              <Button className='w-full bg-red-600 hover:bg-red-700'>
                Contact Merchandiser
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
