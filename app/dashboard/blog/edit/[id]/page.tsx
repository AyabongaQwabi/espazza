import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the EditBlogPost component with SSR disabled
const EditBlogPostDynamic = dynamic(
  () => import('./edit-post-client'),
  { ssr: false } // This ensures the component only loads on the client side
);

export default function EditBlogPostPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 pt-6 pb-20 flex items-center justify-center'>
          <div className='bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-500/20 p-8 max-w-md mx-auto text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4'></div>
            <p className='text-pink-200 text-lg'>Loading blog post editor...</p>
          </div>
        </div>
      }
    >
      <EditBlogPostDynamic params={params} />
    </Suspense>
  );
}
