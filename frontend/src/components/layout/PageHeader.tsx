import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export const PageHeader = ({ title, description, children, className }: PageHeaderProps) => {
    return (
        <div className={cn(
            "relative bg-purple-50 dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-purple-100 dark:border-slate-700 transition-all duration-700 overflow-hidden mb-6",
            className
        )}>
            {/* Glossy Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    {/* Brand Logo Marker */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-100 to-rose-100 dark:from-purple-900/50 dark:to-rose-900/50 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                        <div className="relative flex h-12 w-12 min-w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-purple-100 dark:ring-slate-700 group-hover:scale-105 transition-transform duration-500">
                            <img src="/logo.png" alt="StockMeister" className="h-7 w-7 object-contain opacity-90" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 font-display">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#7c3176]/30"></span>
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {children && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};
