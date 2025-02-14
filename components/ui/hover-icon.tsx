import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface HoverIconProps {
  Icon: LucideIcon;
  size?: number;
  color?: string;
}

export function HoverIcon({ Icon, size = 24, color = 'currentColor' }: HoverIconProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.2, rotate: 10 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Icon size={size} className={`text-${color}`} />
    </motion.div>
  );
}