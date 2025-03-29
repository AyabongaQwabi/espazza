'use client';

import { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  adKey: string;
  width: number;
  height: number;
  format?: string;
  className?: string;
  adNetwork?: 'highperformance' | 'effectiverate';
}

export default function AdBanner({
  adKey,
  width,
  height,
  format = 'iframe',
  className = '',
  adNetwork = 'highperformance',
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Only run this once per component instance
    if (scriptLoaded.current || !containerRef.current) return;

    // Mark as loaded to prevent duplicate script injection
    scriptLoaded.current = true;

    // In development, just show a placeholder
    if (isDevelopment) {
      return;
    }

    // Create a unique ID for this ad container
    const containerId = `ad-container-${adKey}`;
    containerRef.current.id = containerId;

    // Set a timeout to check if the ad loaded
    const timeoutId = setTimeout(() => {
      // If the container is empty after 5 seconds, consider it an error
      if (containerRef.current && containerRef.current.children.length <= 1) {
        setAdError(true);
      }
    }, 5000);

    // Create the script element
    const script = document.createElement('script');
    script.type = 'text/javascript';

    // Set the domain based on the ad network
    const domain =
      adNetwork === 'highperformance'
        ? 'www.highperformanceformat.com'
        : 'pl26249233.effectiveratecpm.com';

    // Define the global options for this ad
    const atOptionsVar = `atOptions_${adKey.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Add the script content
    script.innerHTML = `
      var ${atOptionsVar} = {
        'key': '${adKey}',
        'format': '${format}',
        'height': ${height},
        'width': ${width},
        'params': {}
      };
      try {
        var adScript = document.createElement('script');
        adScript.src = '//${domain}/${adKey}/invoke.js';
        adScript.onload = function() {
          document.getElementById('${containerId}').dataset.loaded = 'true';
        };
        adScript.onerror = function() {
          document.getElementById('${containerId}').dataset.error = 'true';
        };
        document.getElementById('${containerId}').appendChild(adScript);
      } catch(e) {
        document.getElementById('${containerId}').dataset.error = 'true';
        console.error('Ad loading error:', e);
      }
    `;

    // Append the script to the container
    containerRef.current.appendChild(script);

    // Set up a mutation observer to detect when ad content is added
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any of the added nodes are iframes or divs that might be ads
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (
              node.nodeName === 'IFRAME' ||
              (node.nodeName === 'DIV' && node !== script)
            ) {
              setAdLoaded(true);
              clearTimeout(timeoutId);
              observer.disconnect();
              return;
            }
          }
        }
      }
    });

    observer.observe(containerRef.current, { childList: true, subtree: true });

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      if (containerRef.current) {
        const scriptElements = containerRef.current.querySelectorAll('script');
        scriptElements.forEach((el) => el.remove());
      }
    };
  }, [adKey, width, height, format, adNetwork, isDevelopment]);

  // Check for data attributes that might be set by the script
  useEffect(() => {
    if (!containerRef.current) return;

    const checkAttributes = () => {
      if (containerRef.current?.dataset.loaded === 'true') {
        setAdLoaded(true);
      }
      if (containerRef.current?.dataset.error === 'true') {
        setAdError(true);
      }
    };

    // Check immediately and set up an interval to check periodically
    checkAttributes();
    const intervalId = setInterval(checkAttributes, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`ad-container ${className}`}
      style={{
        minHeight: height,
        minWidth: width,
        ...(isDevelopment || adError
          ? {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.1)',
              border: '1px dashed #666',
              color: '#666',
              fontSize: '14px',
            }
          : {}),
      }}
    >
      {isDevelopment && `Ad Placeholder (${width}x${height})`}
      {adError && !isDevelopment && (
        <div className='text-center p-2'>
          <p>Advertisement</p>
          <p className='text-xs opacity-50'>Support our site</p>
        </div>
      )}
    </div>
  );
}
