import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface IconCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function IconCard({ Icon, title, description, className }: IconCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon className="w-6 h-6 text-red-500" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}