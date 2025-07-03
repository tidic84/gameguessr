import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useAnimationSettings } from '@/store/gameStore';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  animated?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className, 
  animated = true,
  leftIcon,
  rightIcon,
  ...props 
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    ghost: 'text-white hover:bg-white/10',
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-8 text-lg',
  };

  const animationSettings = useAnimationSettings();
  const combinedClassName = cn(baseClasses, variants[variant], sizes[size], className);
  
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Nous allons utiliser la CSS pour les animations de base pour éviter les problèmes de types
  return (
    <button
      className={`${combinedClassName} ${animated && animationSettings.globalEnabled ? 'hover:scale-105 active:scale-95 transition-transform' : ''}`}
      {...props}
    >
      {leftIcon && <span className={`mr-2 ${iconSize[size]}`}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={`ml-2 ${iconSize[size]}`}>{rightIcon}</span>}
    </button>
  );
};

export default Button;
