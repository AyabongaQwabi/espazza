'use client';
import { MailIcon, PhoneIcon, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function ContactPage() {
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
            Contact
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

      {/* Contact Section */}
      <div className='max-w-7xl mx-auto px-4 py-20'>
        <div className='grid md:grid-cols-2 gap-12'>
          {/* About Us */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className='text-3xl font-bold text-white mb-8'>
              About eSpazza
            </h2>
            <div className='prose prose-invert max-w-none'>
              <p className='text-zinc-300 mb-6'>
                eSpazza is a positive impact hip hop music platform dedicated to
                providing valuable information about the hip hop industry in
                South Africa. We aim to connect artists, producers, and fans
                while promoting the rich culture and talent within the South
                African hip hop scene.
              </p>
              <p className='text-zinc-300 mb-6'>
                Our mission is to elevate Xhosa hip hop and create opportunities
                for emerging artists. We provide resources, connections, and
                exposure to help artists navigate the industry and reach their
                full potential.
              </p>
              <p className='text-zinc-300'>
                Whether you're an artist looking for collaboration, a fan
                seeking new music, or an industry professional interested in
                partnerships, we're here to connect and support the growth of
                hip hop culture in South Africa.
              </p>
            </div>
          </motion.div>

          {/* Contact Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className='bg-zinc-800 p-8 rounded-lg'
          >
            <h2 className='text-2xl font-bold text-white mb-8'>Get In Touch</h2>

            <div className='space-y-8'>
              {/* Call Button */}
              <div className='bg-zinc-700/50 p-6 rounded-lg'>
                <div className='flex items-center mb-4'>
                  <PhoneIcon className='h-8 w-8 text-red-600 mr-4' />
                  <div>
                    <h3 className='text-white font-semibold text-lg'>
                      Call Us
                    </h3>
                    <p className='text-zinc-400'>
                      Available Monday-Friday, 9am-5pm
                    </p>
                  </div>
                </div>
                <Button
                  className='w-full bg-red-600 hover:bg-red-700 h-12 text-base'
                  onClick={() => (window.location.href = 'tel:0672023083')}
                >
                  Call 067 202 3083
                </Button>
              </div>

              {/* WhatsApp Button */}
              <div className='bg-zinc-700/50 p-6 rounded-lg'>
                <div className='flex items-center mb-4'>
                  <MessageSquare className='h-8 w-8 text-green-500 mr-4' />
                  <div>
                    <h3 className='text-white font-semibold text-lg'>
                      WhatsApp
                    </h3>
                    <p className='text-zinc-400'>
                      Quick responses via WhatsApp
                    </p>
                  </div>
                </div>
                <Button
                  className='w-full bg-green-600 hover:bg-green-700 h-12 text-base'
                  onClick={() =>
                    window.open('https://wa.me/27603116777', '_blank')
                  }
                >
                  WhatsApp 060 311 6777
                </Button>
              </div>

              {/* Email Button */}
              <div className='bg-zinc-700/50 p-6 rounded-lg'>
                <div className='flex items-center mb-4'>
                  <MailIcon className='h-8 w-8 text-blue-500 mr-4' />
                  <div>
                    <h3 className='text-white font-semibold text-lg'>Email</h3>
                    <p className='text-zinc-400'>Send us a detailed message</p>
                  </div>
                </div>
                <Button
                  className='w-full bg-blue-600 hover:bg-blue-700 h-12 text-base'
                  onClick={() =>
                    (window.location.href = 'mailto:info@espazza.co.za')
                  }
                >
                  Email info@espazza.co.za
                </Button>
              </div>
            </div>

            <div className='mt-8 text-center text-zinc-400 text-sm'>
              <p>We aim to respond to all inquiries within 24-48 hours.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
