import type React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className='w-full'>
      <Progress value={progress} className='w-full' />
      <p className='text-sm text-gray-500 mt-1'>
        {Math.round(progress)}% complete
      </p>
    </div>
  );
};

export default ProgressBar;
