import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface IconButtonProps {
  Icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export function IconButton({
  Icon,
  label,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn('group', className)}
      disabled={disabled}
    >
      <motion.div
        className="flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon className="w-4 h-4 group-hover:text-red-500 transition-colors" />
        <span>{label}</span>
      </motion.div>
    </Button>
  );
}