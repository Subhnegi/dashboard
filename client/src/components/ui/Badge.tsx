import React from 'react';
import type { StockStatus, PaymentStatus, SaleStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  stockStatus?: StockStatus;
  paymentStatus?: PaymentStatus;
  saleStatus?: SaleStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  stockStatus,
  paymentStatus,
  saleStatus,
  className = '',
  size = 'md',
}) => {
  let resolvedVariant = variant || 'neutral';
  let label = children;

  if (stockStatus) {
    switch (stockStatus) {
      case 'IN_STOCK':
        resolvedVariant = 'success';
        label = label || 'In Stock';
        break;
      case 'LOW_STOCK':
        resolvedVariant = 'warning';
        label = label || 'Low Stock';
        break;
      case 'OUT_OF_STOCK':
        resolvedVariant = 'error';
        label = label || 'Out of Stock';
        break;
      case 'INACTIVE':
        resolvedVariant = 'neutral';
        label = label || 'Inactive';
        break;
    }
  } else if (paymentStatus) {
    switch (paymentStatus) {
      case 'PAID':
        resolvedVariant = 'success';
        label = label || 'Paid';
        break;
      case 'PARTIALLY_PAID':
        resolvedVariant = 'warning';
        label = label || 'Partially Paid';
        break;
      case 'UNPAID':
        resolvedVariant = 'error';
        label = label || 'Unpaid';
        break;
    }
  } else if (saleStatus) {
    switch (saleStatus) {
      case 'CONFIRMED':
        resolvedVariant = 'success';
        label = label || 'Confirmed';
        break;
      case 'CANCELLED':
        resolvedVariant = 'error';
        label = label || 'Cancelled';
        break;
    }
  }

  const variantStyles = {
    success: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
    warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    error: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
    info: 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]',
    neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium leading-none',
    md: 'text-[11px] px-2.5 py-1 gap-1.5 font-semibold leading-none',
  };

  const dotColors = {
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    error: 'bg-[#EF4444]',
    info: 'bg-[#0284C7]',
    neutral: 'bg-[#94A3B8]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${variantStyles[resolvedVariant]} ${sizeStyles[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[resolvedVariant]}`} />
      <span>{label}</span>
    </span>
  );
};
