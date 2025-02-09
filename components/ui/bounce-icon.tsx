'use client';

import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface BounceIconProps {
  icon: LucideIcon;
  className?: string;
  delay?: number;
}

export function BounceIcon({ 
  icon: Icon, 
  className = "", 
  delay = 0 
}: BounceIconProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-5, 0, -5] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay
      }}
      className={className}
    >
      <Icon />
    </motion.div>
  );
}