'use client';

import { useEffect, useRef } from 'react';
export default function Banner(options: {
  adKey: string;
  height: number;
  weight: number;
  url: string;
}): JSX.Element {
  const banner = useRef<HTMLDivElement>();

  const atOptions = {
    key: options.adKey,
    format: 'iframe',
    height: options.height,
    width: options.weight,
    params: {},
  };
  console.log(atOptions);

  useEffect(() => {
    if (banner.current && !banner.current.firstChild) {
      const conf = document.createElement('script');
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = options.url;
      conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`;

      banner.current.append(conf);
      banner.current.append(script);
    }
  }, [banner]);

  return (
    <div
      className='mx-2 my-5 border border-gray-200 justify-center items-center text-white text-center'
      ref={banner}
    ></div>
  );
}
