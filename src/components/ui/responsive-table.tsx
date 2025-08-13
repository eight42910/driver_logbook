import React from 'react';
import { cn } from '@/lib/utils';

/**
 * レスポンシブテーブルコンポーネント
 * モバイルでの横スクロール対応とコンパクト表示
 */

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * レスポンシブテーブルコンテナ
 * モバイルで横スクロールを可能にする
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full inline-block align-middle">
        <div className={cn('overflow-hidden', className)}>{children}</div>
      </div>
    </div>
  );
}

/**
 * テーブル要素
 */
export function Table({ children, className }: ResponsiveTableProps) {
  return (
    <table className={cn('min-w-full divide-y divide-gray-200', className)}>
      {children}
    </table>
  );
}

/**
 * テーブルヘッダー
 */
export function TableHeader({ children, className }: ResponsiveTableProps) {
  return <thead className={cn('bg-gray-50', className)}>{children}</thead>;
}

/**
 * テーブルボディ
 */
export function TableBody({ children, className }: ResponsiveTableProps) {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  );
}

/**
 * テーブル行
 */
export function TableRow({
  children,
  className,
  onClick,
}: ResponsiveTableProps & { onClick?: () => void }) {
  return (
    <tr
      className={cn(
        'hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

/**
 * テーブルヘッダーセル
 */
export function TableHead({ children, className }: ResponsiveTableProps) {
  return (
    <th
      className={cn(
        'px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-6',
        className
      )}
    >
      {children}
    </th>
  );
}

/**
 * テーブルデータセル
 */
export function TableCell({ children, className }: ResponsiveTableProps) {
  return (
    <td
      className={cn(
        'px-3 py-4 text-sm text-gray-900 whitespace-nowrap sm:px-6',
        className
      )}
    >
      {children}
    </td>
  );
}

/**
 * モバイル専用カード表示コンポーネント
 * テーブルの代替として使用
 */
interface MobileCardProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info';
  };
  fields: Array<{
    label: string;
    value: string | number | React.ReactNode;
    icon?: React.ReactNode;
  }>;
  actions?: React.ReactNode;
  onClick?: () => void;
}

export function MobileCard({
  title,
  subtitle,
  badge,
  fields,
  actions,
  onClick,
}: MobileCardProps) {
  const badgeColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-4 space-y-3',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow'
      )}
      onClick={onClick}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {badge && (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              badgeColors[badge.variant]
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* フィールド */}
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {field.icon}
              <span>{field.label}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {field.value}
            </div>
          </div>
        ))}
      </div>

      {/* アクション */}
      {actions && (
        <div className="pt-3 border-t border-gray-200">{actions}</div>
      )}
    </div>
  );
}

/**
 * レスポンシブデータ表示コンポーネント
 * デスクトップではテーブル、モバイルではカード表示
 */
interface ResponsiveDataViewProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
  }>;
  mobileCard: (item: T) => React.ComponentProps<typeof MobileCard>;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function ResponsiveDataView<T extends { id: string | number }>({
  data,
  columns,
  mobileCard,
  onRowClick,
  className,
}: ResponsiveDataViewProps<T>) {
  return (
    <div className={className}>
      {/* デスクトップ用テーブル */}
      <div className="hidden md:block">
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={column.className}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className={column.className}
                    >
                      {column.render
                        ? column.render(item)
                        : String(item[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      {/* モバイル用カード */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <MobileCard
            key={item.id}
            {...mobileCard(item)}
            onClick={() => onRowClick?.(item)}
          />
        ))}
      </div>
    </div>
  );
}
