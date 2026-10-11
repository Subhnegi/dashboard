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
      className={`bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition-all ${
        hoverable ? 'hover:border-[#D0D5DD] hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)] cursor-pointer' : ''
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
  <div className={`px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-4 ${className}`}>
    <div>
      <h3 className="text-base font-semibold text-[#172033] leading-snug">{title}</h3>
      {subtitle && <p className="text-xs text-[#667085] mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-5 ${className}`}>{children}</div>;
