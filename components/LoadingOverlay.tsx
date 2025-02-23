import { Loader2 } from 'lucide-react';

export function LoadingOverlay() {
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <p className='text-lg font-semibold'>Processing your purchase...</p>
      </div>
    </div>
  );
}
