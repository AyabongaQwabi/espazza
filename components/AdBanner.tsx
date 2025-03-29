'use client';

import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    // Only run this once per component instance
    if (scriptLoaded.current || !containerRef.current) return;

    // Mark as loaded to prevent duplicate script injection
    scriptLoaded.current = true;

    // Create a unique ID for this ad container
    const containerId = `ad-container-${adKey}`;
    containerRef.current.id = containerId;

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
      document.getElementById('${containerId}').appendChild(document.createElement('script')).src = '//${domain}/${adKey}/invoke.js';
    `;

    // Append the script to the container
    containerRef.current.appendChild(script);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        const scriptElements = containerRef.current.querySelectorAll('script');
        scriptElements.forEach((el) => el.remove());
      }
    };
  }, [adKey, width, height, format, adNetwork]);

  return (
    <div
      ref={containerRef}
      className={`ad-container ${className}`}
      style={{ minHeight: height, minWidth: width }}
    />
  );
}
