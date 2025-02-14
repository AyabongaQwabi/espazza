import { Input } from './input';
import { useState } from 'react';
import zxcvbn from 'zxcvbn';

type PasswordFieldProps = {
  name: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  minLength?: number;
  onStrengthChange?: (strength: number) => void;
  ariaLabel?: string;
};

export function PasswordField({
  name,
  placeholder = 'Password',
  required = true,
  className,
  minLength = 8,
  onStrengthChange,
  ariaLabel = 'Password',
}: PasswordFieldProps) {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const result = zxcvbn(newPassword);
    setStrength(result.score);
    onStrengthChange?.(result.score);
  };

  const getStrengthWidth = (strength: number) => {
    return `${(strength + 1) * 20}%`;
  };

  const getStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
        return 'bg-red-500';
      case 1:
        return 'bg-orange-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-lime-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-zinc-200';
    }
  };

  return (
    <div>
      <Input
        type='password'
        name={name}
        placeholder={placeholder}
        required={required}
        className={className}
        minLength={minLength}
        onChange={handlePasswordChange}
        ariaLabel={ariaLabel}
      />
      <div className='mt-1 h-2 w-full bg-zinc-200 rounded-full overflow-hidden'>
        <div
          className={`h-full ${getStrengthColor(
            strength
          )} transition-all duration-300 ease-in-out`}
          style={{ width: getStrengthWidth(strength) }}
        ></div>
      </div>
    </div>
  );
}
