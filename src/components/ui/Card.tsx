import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'glass';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all duration-200';
  
  const variantStyles = {
    default: 'bg-white border border-slate-200/80 shadow-sm hover:shadow-md',
    bordered: 'bg-white border-2 border-slate-200 shadow-sm',
    glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-lg',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
