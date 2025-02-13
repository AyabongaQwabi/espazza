'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfUse() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12'>
      <div className='container mx-auto px-4 max-w-4xl'>
        <Button variant='ghost' asChild className='mb-8 hover:bg-primary/10'>
          <Link href='/'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Home
          </Link>
        </Button>

        <h1 className='text-4xl font-bold mb-8'>Terms of Use</h1>

        <div className='space-y-8 text-foreground/80'>
          <section>
            <h2 className='text-2xl font-semibold mb-4'>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using eSpazza, you agree to be bound by these
              Terms of Use. If you disagree with any part of these terms, you
              may not access our service.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>2. Artist Accounts</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>
                You must be at least 18 years old to create an artist account
              </li>
              <li>You are responsible for maintaining account security</li>
              <li>Your profile must contain accurate information</li>
              <li>
                We reserve the right to suspend or terminate accounts that
                violate our terms
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>
              3. Content Guidelines
            </h2>
            <p className='mb-4'>When using eSpazza, you agree not to post:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Copyrighted material without permission</li>
              <li>Explicit or inappropriate content</li>
              <li>False or misleading information</li>
              <li>Harmful or malicious content</li>
              <li>Content that violates others' rights</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>
              4. Events and Merchandise
            </h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Events must be accurately described and legally compliant</li>
              <li>Merchandise must be accurately represented</li>
              <li>You are responsible for fulfilling merchandise orders</li>
              <li>You must comply with all applicable laws and regulations</li>
              <li>We take a commission on sales (see pricing page)</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>
              5. Intellectual Property
            </h2>
            <p>
              You retain rights to your content, but grant us a license to use
              it on our platform. We respect intellectual property rights and
              will respond to infringement notices.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>
              6. Payments and Refunds
            </h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>
                All payments are processed securely through our payment
                providers
              </li>
              <li>Artists are responsible for their refund policies</li>
              <li>We may mediate disputes between artists and customers</li>
              <li>
                Payouts to artists are made according to our payment schedule
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>
              7. Limitation of Liability
            </h2>
            <p>
              eSpazza is provided "as is" without warranties. We are not liable
              for disputes between users or for losses related to using our
              platform.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>8. Changes to Terms</h2>
            <p>
              We may modify these terms at any time. Continued use of eSpazza
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>9. Contact</h2>
            <p>
              For questions about these terms, please contact{' '}
              <a
                href='mailto:legal@espazza.com'
                className='text-primary hover:underline'
              >
                legal@espazza.com
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
