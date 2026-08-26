import React from 'react';

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  category?: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'info';
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  category,
  badge,
  badgeVariant = 'default',
  actions,
  children,
}) => {
  const getBadgeClass = () => {
    switch (badgeVariant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          {category && (
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <span>{category}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{title}</h1>
            {badge !== undefined && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${getBadgeClass()}`}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-stone-500 leading-relaxed max-w-3xl">{description}</p>
          )}
        </div>

        {actions && <div className="flex items-center flex-wrap gap-2.5">{actions}</div>}
      </div>

      {children && <div className="mt-4 pt-4 border-t border-stone-100">{children}</div>}
    </div>
  );
};
