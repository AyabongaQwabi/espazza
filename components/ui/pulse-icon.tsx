import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface PulseIconProps {
  Icon: LucideIcon;
  size?: number;
  color?: string;
}

export function PulseIcon({ Icon, size = 24, color = 'currentColor' }: PulseIconProps) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Icon size={size} className={`text-${color}`} />
    </motion.div>
  );
}