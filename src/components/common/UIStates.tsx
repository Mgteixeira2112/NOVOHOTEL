import React from 'react';
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.FC<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-6 shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto mb-4 border border-stone-200">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-base text-stone-900 mb-1">{title}</h3>
      <p className="text-xs text-stone-500 leading-relaxed mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando dados operacionais...',
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs ${className}`}
    >
      <Loader2 className="w-6 h-6 text-stone-600 animate-spin" />
      <span className="text-xs font-medium text-stone-500">{message}</span>
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Erro ao processar',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`bg-rose-50/70 rounded-2xl border border-rose-200 p-6 text-rose-900 shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="font-bold text-xs uppercase tracking-wider">{title}</div>
          <p className="text-xs text-rose-800 leading-relaxed">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-rose-900 text-white rounded-lg text-xs font-bold hover:bg-rose-800 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </button>
        )}
      </div>
    </div>
  );
};

export interface StatSummaryCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  isActive?: boolean;
}

export const StatSummaryCard: React.FC<StatSummaryCardProps> = ({
  label,
  value,
  hint,
  icon,
  trend,
  onClick,
  isActive,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border p-4 shadow-xs transition ${
        onClick ? 'cursor-pointer hover:border-stone-400' : ''
      } ${isActive ? 'border-stone-900 ring-2 ring-stone-900/10' : 'border-stone-200'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500">{label}</span>
        {icon && (
          <span className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2.5 text-2xl font-black text-stone-900 tracking-tight">{value}</div>
      {(hint || trend) && (
        <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
          {hint && <span>{hint}</span>}
          {trend && (
            <span
              className={`font-bold ${
                trend.isPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
