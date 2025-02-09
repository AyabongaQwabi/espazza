import { MailIcon, PhoneIcon, MapPinIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Hero Section */}
      <div className="relative h-[40vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80")',
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Qhagamshelana
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get in Touch with XHAP
          </p>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-8">
              Nxibelelana Nathi
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <MailIcon className="h-6 w-6 text-red-600 mt-1 mr-4" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Email</h3>
                  <p className="text-gray-400">info@xhap.co.za</p>
                </div>
              </div>
              <div className="flex items-start">
                <PhoneIcon className="h-6 w-6 text-red-600 mt-1 mr-4" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Phone</h3>
                  <p className="text-gray-400">+27 (0) 21 123 4567</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPinIcon className="h-6 w-6 text-red-600 mt-1 mr-4" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Address</h3>
                  <p className="text-gray-400">
                    123 Main Street<br />
                    Cape Town<br />
                    8001<br />
                    South Africa
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-zinc-900 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-6">
              Thumela Umyalezo
            </h2>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Igama (Name)
                </label>
                <Input className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  I-imeyile (Email)
                </label>
                <Input type="email" className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Umxeba (Phone)
                </label>
                <Input type="tel" className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Umyalezo (Message)
                </label>
                <Textarea className="w-full h-32" />
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Thumela (Send)
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}