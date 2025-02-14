'use client';

import { useState } from 'react';
import { MailIcon, PhoneIcon, MapPinIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const { error } = await supabase
        .from('contacts')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
        }]);

      if (error) throw error;

      toast({
        title: 'Message Sent',
        description: 'Thank you for your message. We will get back to you soon.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-zinc-900 pt-16'>
      {/* Hero Section */}
      <div className='relative h-[40vh] flex items-center justify-center'>
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80")',
          }}
        >
          <div className='absolute inset-0 bg-zinc-900/70' />
        </div>
        <div className='relative z-10 text-center px-4'>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='text-4xl md:text-6xl font-bold text-white mb-4'
          >
            Qhagamshelana
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='text-xl text-zinc-300 max-w-2xl mx-auto'
          >
            Get in Touch with eSpazza
          </motion.p>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className='max-w-7xl mx-auto px-4 py-20'>
        <div className='grid md:grid-cols-2 gap-12'>
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className='text-3xl font-bold text-white mb-8'>
              Nxibelelana Nathi
            </h2>
            <div className='space-y-6'>
              <div className='flex items-start'>
                <MailIcon className='h-6 w-6 text-red-600 mt-1 mr-4' />
                <div>
                  <h3 className='text-white font-semibold mb-1'>Email</h3>
                  <p className='text-zinc-400'>info@espazza.co.za</p>
                </div>
              </div>
              <div className='flex items-start'>
                <PhoneIcon className='h-6 w-6 text-red-600 mt-1 mr-4' />
                <div>
                  <h3 className='text-white font-semibold mb-1'>Phone</h3>
                  <p className='text-zinc-400'>+27 (0) 21 123 4567</p>
                </div>
              </div>
              <div className='flex items-start'>
                <MapPinIcon className='h-6 w-6 text-red-600 mt-1 mr-4' />
                <div>
                  <h3 className='text-white font-semibold mb-1'>Address</h3>
                  <p className='text-zinc-400'>
                    123 Main Street
                    <br />
                    Cape Town
                    <br />
                    8001
                    <br />
                    South Africa
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className='bg-zinc-800 p-8 rounded-lg'
          >
            <h2 className='text-2xl font-bold text-white mb-6'>
              Thumela Umyalezo
            </h2>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-zinc-400 mb-1'>
                  Igama (Name) <span className='text-red-500'>*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className='w-full'
                  placeholder='Enter your name'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-zinc-400 mb-1'>
                  I-imeyile (Email) <span className='text-red-500'>*</span>
                </label>
                <Input
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className='w-full'
                  placeholder='Enter your email'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-zinc-400 mb-1'>
                  Umxeba (Phone)
                </label>
                <Input
                  type='tel'
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className='w-full'
                  placeholder='Enter your phone number'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-zinc-400 mb-1'>
                  Umyalezo (Message) <span className='text-red-500'>*</span>
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className='w-full h-32'
                  placeholder='Enter your message'
                />
              </div>
              <Button
                type='submit'
                className='w-full bg-red-600 hover:bg-red-700'
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Thumela (Send)'}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}