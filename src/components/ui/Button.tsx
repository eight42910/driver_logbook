import { ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

const baseClasses = 'inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2';
const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400',
};

export const Button = ({ variant = 'primary', className = '', ...props }: ButtonProps) => {
  const styles = `${baseClasses} ${variants[variant]} ${className}`.trim();

  return <button className={styles} {...props} />;
};
