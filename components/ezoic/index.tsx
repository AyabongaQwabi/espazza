'use client';

import { useEffect } from 'react';

const Ezoic = () => {
  useEffect(() => {
    const handleEzoicLoad = () => {
      try {
        const ezoic = window.ezstandalone;
        if (ezoic) {
          ezoic.define(112, 113);
          if (!ezoic.enabled) {
            ezoic.enable();
            ezoic.display();
            ezoic.refresh();
          }
        } else {
          // Ezoic script is not loaded yet, try again later
          setTimeout(handleEzoicLoad, 500);
        }
      } catch (ex) {
        console.error('Error with Ezoic:', ex);
      }
    };

    handleEzoicLoad();
  }, []);

  return <div id='ezoic-pub-ad-placeholder-113'> </div>;
};

export default Ezoic;
