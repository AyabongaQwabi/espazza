'use client';

import type React from 'react';

import { Input } from './input';
import { useState } from 'react';
import zxcvbn from 'zxcvbn';
import { Eye, EyeOff, Check, X } from 'lucide-react';

type PasswordFieldProps = {
  name: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  minLength?: number;
  onStrengthChange?: (strength: number) => void;
  ariaLabel?: string;
};

type PasswordCriteria = {
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasMinLength: boolean;
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
  const [showPassword, setShowPassword] = useState(false);
  const [criteria, setCriteria] = useState<PasswordCriteria>({
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const result = zxcvbn(newPassword);
    setStrength(result.score);
    onStrengthChange?.(result.score);
    updateCriteria(newPassword);
  };

  const updateCriteria = (password: string) => {
    setCriteria({
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasMinLength: password.length >= minLength,
    });
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
      <div className='relative'>
        <Input
          type={showPassword ? 'text' : 'password'}
          name={name}
          placeholder={placeholder}
          required={required}
          className={`${className} pr-10`}
          minLength={minLength}
          onChange={handlePasswordChange}
          aria-label={ariaLabel}
          value={password}
        />
        <button
          type='button'
          className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5'
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className='h-5 w-5 text-gray-400' />
          ) : (
            <Eye className='h-5 w-5 text-gray-400' />
          )}
        </button>
      </div>
      <div className='mt-1 h-2 w-full bg-zinc-200 rounded-full overflow-hidden'>
        <div
          className={`h-full ${getStrengthColor(
            strength
          )} transition-all duration-300 ease-in-out`}
          style={{ width: getStrengthWidth(strength) }}
        ></div>
      </div>
      <div className='mt-2 text-sm'>
        <PasswordCriteriaItem met={criteria.hasUppercase}>
          Inoo nobumba omkhulu
        </PasswordCriteriaItem>
        <PasswordCriteriaItem met={criteria.hasLowercase}>
          Inoo nobumba omncinci
        </PasswordCriteriaItem>
        <PasswordCriteriaItem met={criteria.hasNumber}>
          Inenani
        </PasswordCriteriaItem>
        <PasswordCriteriaItem met={criteria.hasSpecialChar}>
          Inophawu olukhethekileyo
        </PasswordCriteriaItem>
        <PasswordCriteriaItem met={criteria.hasMinLength}>
          Ubuncinane ngoo nobumba abasi-{minLength}
        </PasswordCriteriaItem>
      </div>
    </div>
  );
}

function PasswordCriteriaItem({
  met,
  children,
}: {
  met: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center ${met ? 'text-green-500' : 'text-red-500'}`}
    >
      {met ? (
        <Check className='h-4 w-4 mr-2' />
      ) : (
        <X className='h-4 w-4 mr-2' />
      )}
      {children}
    </div>
  );
}
