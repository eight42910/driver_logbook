import { PropsWithChildren } from 'react';

export type BadgeProps = PropsWithChildren<{
  color?: 'default' | 'info';
}>;

const styles: Record<NonNullable<BadgeProps['color']>, string> = {
  default: 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
};

export const Badge = ({ children, color = 'default' }: BadgeProps) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[color]}`}>
      {children}
    </span>
  );
};
