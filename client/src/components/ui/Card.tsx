import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] transition-all duration-150 ${
        hoverable ? 'hover:border-[#CBD5E1] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => (
  <div className={`px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between gap-4 ${className}`}>
    <div>
      <h3 className="text-sm font-semibold text-[#0F172A] tracking-tight leading-snug">{title}</h3>
      {subtitle && <p className="text-xs text-[#64748B] mt-0.5 leading-normal">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-5 ${className}`}>{children}</div>;
