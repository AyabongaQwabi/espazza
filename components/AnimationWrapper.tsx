'use client'; // ✅ Mark this as a client component

import { AnimatePresence, motion } from 'framer-motion';

export default function AnimatedWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode='wait'>
      <motion.main
        className='flex-1 mt-20'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
