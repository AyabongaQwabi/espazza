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

          <section>
            <h2 className='text-2xl font-semibold mb-4'>7. Ezoic Services</h2>
            <div className='bg-secondary/20 p-4 rounded-md text-sm space-y-4'>
              <p>
                This website uses the services of Ezoic Inc. ("Ezoic"),
                including to manage third-party interest-based advertising.
                Ezoic may employ a variety of technologies on this website,
                including tools to serve content, display advertisements and
                enable advertising to visitors of this website, which may
                utilize first and third-party cookies.
              </p>
              <p>
                A cookie is a small text file sent to your device by a web
                server that enables the website to remember information about
                your browsing activity. First-party cookies are created by the
                site you are visiting, while third-party cookies are set by
                domains other than the one you're visiting. Ezoic and our
                partners may place third-party cookies, tags, beacons, pixels,
                and similar technologies to monitor interactions with
                advertisements and optimize ad targeting. Please note that
                disabling cookies may limit access to certain content and
                features on the website, and rejecting cookies does not
                eliminate advertisements but will result in non-personalized
                advertising. You can find more information about cookies and how
                to manage them here.
              </p>
              <p>
                The following information may be collected, used, and stored in
                a cookie when serving personalized ads:
              </p>
              <ul className='list-disc pl-6 space-y-1 my-2'>
                <li>IP address</li>
                <li>Operating system type and version</li>
                <li>Device type</li>
                <li>Language preferences</li>
                <li>Web browser type</li>
                <li>Email (in a hashed or encrypted form)</li>
              </ul>
              <p>
                Ezoic and its partners may use this data in combination with
                information that has been independently collected to deliver
                targeted advertisements across various platforms and websites.
                Ezoic's partners may also gather additional data, such as unique
                IDs, advertising IDs, geolocation data, usage data, device
                information, traffic data, referral sources, and interactions
                between users and websites or advertisements, to create audience
                segments for targeted advertising across different devices,
                browsers, and apps. You can find more information about
                interest-based advertising and how to manage them here.
              </p>
              <p>
                You can view Ezoic's privacy policy at{' '}
                <a
                  href='https://g.ezoic.net/privacy/espazza.co.za'
                  className='text-primary hover:underline'
                >
                  https://g.ezoic.net/privacy/espazza.co.za
                </a>
                , or for additional information about Ezoic's advertising and
                other partners, you can view Ezoic's advertising partners{' '}
                <a
                  href='https://www.ezoic.com/partners/'
                  className='text-primary hover:underline'
                >
                  here
                </a>
                .
              </p>
              <p>
                Ezoic contractually prohibits Ezoic publishers from including
                information that can be used to identify individuals (such as
                name, email, address, telephone number, social security number,
                banking information, or any other personal data) in the
                information sent to Ezoic.
              </p>
              <p>
                If you have any questions about how Ezoic uses your data, you
                can find out at{' '}
                <a
                  href='https://www.ezoic.com/privacy-policy/'
                  className='text-primary hover:underline'
                >
                  www.ezoic.com/privacy-policy/
                </a>
                .
              </p>
            </div>
          </section>

          <p className='text-sm text-foreground/60 mt-8'>
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
