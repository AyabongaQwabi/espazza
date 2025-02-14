import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface SpinIconProps {
  Icon: LucideIcon;
  size?: number;
  color?: string;
}

export function SpinIcon({ Icon, size = 24, color = 'currentColor' }: SpinIconProps) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <Icon size={size} className={`text-${color}`} />
    </motion.div>
  );
}