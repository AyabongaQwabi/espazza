import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface BounceIconProps {
  Icon: LucideIcon;
  size?: number;
  color?: string;
}

export function BounceIcon({ Icon, size = 24, color = 'currentColor' }: BounceIconProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-2, 2, -2] }}
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