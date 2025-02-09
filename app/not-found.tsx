import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MusicIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <MusicIcon className="h-12 w-12 text-red-600 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          404 - Iphepha Alifumaneki
        </h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Iphepha olifunayo alikho okanye lishenxisiwe.
        </p>
        <Button asChild>
          <Link href="/">
            Buyela eKhaya (Return Home)
          </Link>
        </Button>
      </div>
    </div>
  );
}