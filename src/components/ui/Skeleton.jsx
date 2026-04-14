import React from 'react';

const Skeleton = ({ className = '', variant = 'text' }) => {
  const baseClasses = "animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg";
  
  if (variant === 'circle') {
    return <div className={`${baseClasses} rounded-full ${className}`} />;
  }

  if (variant === 'table-row') {
    return (
      <div className={`flex gap-4 items-center p-4 border-b border-slate-50 dark:border-slate-800 ${className}`}>
        <div className="size-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
          <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-900 animate-pulse rounded" />
        </div>
        <div className="h-8 w-20 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 ${className}`}>
        <div className="size-12 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-900 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return <div className={`${baseClasses} h-4 w-full ${className}`} />;
};

export default Skeleton;
