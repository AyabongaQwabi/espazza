import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface IconBadgeProps {
  Icon: LucideIcon;
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export function IconBadge({ Icon, label, variant = 'default', className }: IconBadgeProps) {
  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Badge variant={variant} className={cn('flex items-center gap-1', className)}>
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </Badge>
    </motion.div>
  );
}