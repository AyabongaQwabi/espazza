'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12'>
      <div className='container mx-auto px-4 max-w-4xl'>
        <Button variant='ghost' asChild className='mb-8 hover:bg-primary/10'>
          <Link href='/'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Home
          </Link>
        </Button>

        <h1 className='text-4xl font-bold mb-8'>Privacy Policy</h1>

        <div className='space-y-8 text-foreground/80'>
          <section>
            <h2 className='text-2xl font-semibold mb-4'>
              1. Information We Collect
            </h2>
            <p className='mb-4'>When you use eSpazza, we collect:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Account information (name, email, password)</li>
              <li>Artist profile information (biography, genre, images)</li>
              <li>Event details (dates, venues, ticket information)</li>
              <li>Merchandise listings (product details, prices, images)</li>
              <li>
                Payment information (processed securely through our payment
                providers)
              </li>
              <li>Usage data (how you interact with our platform)</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>
              2. How We Use Your Information
            </h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>To provide and maintain your artist profile</li>
              <li>To process merchandise sales and event tickets</li>
              <li>To communicate with you about your account and updates</li>
              <li>To improve our platform and user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>
              3. Information Sharing
            </h2>
            <p>We share your information with:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Other users (based on your profile privacy settings)</li>
              <li>Payment processors for transactions</li>
              <li>Service providers who assist our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>4. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Object to data processing</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>5. Security</h2>
            <p>
              We implement appropriate security measures to protect your
              personal information, including encryption, secure servers, and
              regular security assessments.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>6. Contact Us</h2>
            <p>
              For privacy-related questions, please contact us at{' '}
              <a
                href='mailto:privacy@espazza.com'
                className='text-primary hover:underline'
              >
                privacy@espazza.com
              </a>
            </p>
          </section>

          <p className='text-sm text-foreground/60 mt-8'>
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
