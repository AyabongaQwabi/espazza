import { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, CheckCircle2Icon } from 'lucide-react';
import { Input } from './input';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onStrengthChange?: (strength: number) => void;
}

interface ValidationRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export function PasswordField({ onStrengthChange, className, ...props }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [validations, setValidations] = useState<Record<string, boolean>>({});

  const rules: ValidationRule[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      test: (value) => value.length >= 8
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter',
      test: (value) => /[A-Z]/.test(value)
    },
    {
      id: 'lowercase',
      label: 'At least one lowercase letter',
      test: (value) => /[a-z]/.test(value)
    },
    {
      id: 'number',
      label: 'At least one number',
      test: (value) => /[0-9]/.test(value)
    },
    {
      id: 'special',
      label: 'At least one special character',
      test: (value) => /[^A-Za-z0-9]/.test(value)
    }
  ];

  const calculateStrength = (password: string) => {
    const newValidations: Record<string, boolean> = {};
    let score = 0;

    rules.forEach(rule => {
      const isValid = rule.test(password);
      newValidations[rule.id] = isValid;
      if (isValid) score += 20;
    });

    setValidations(newValidations);
    setStrength(score);
    onStrengthChange?.(score);
    
    return score;
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 20) return 'bg-red-500';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 20) return 'Very Weak';
    if (strength <= 40) return 'Weak';
    if (strength <= 60) return 'Medium';
    if (strength <= 80) return 'Strong';
    return 'Very Strong';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    calculateStrength(password);
    props.onChange?.(e);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          type={showPassword ? 'text' : 'password'}
          className={cn("pr-10", className)}
          onChange={handleChange}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={strength} 
          className={cn("h-1", getStrengthColor(strength))} 
        />
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Password Strength:</span>
          <span className={cn(
            "font-medium",
            strength <= 20 ? "text-red-500" :
            strength <= 40 ? "text-orange-500" :
            strength <= 60 ? "text-yellow-500" :
            strength <= 80 ? "text-lime-500" :
            "text-green-500"
          )}>
            {getStrengthText(strength)}
          </span>
        </div>
        
        <ul className="text-xs space-y-1.5">
          {rules.map(rule => (
            <li 
              key={rule.id}
              className={cn(
                "flex items-center gap-2 transition-colors",
                validations[rule.id] ? "text-green-500" : "text-gray-400"
              )}
            >
              <CheckCircle2Icon className={cn(
                "h-3.5 w-3.5 transition-opacity",
                validations[rule.id] ? "opacity-100" : "opacity-0"
              )} />
              {rule.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}