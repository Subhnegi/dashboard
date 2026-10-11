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
    success: 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]',
    warning: 'bg-[#FEF0C7] text-[#B54708] border-[#FEDF89]',
    error: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
    info: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]',
    neutral: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const dotColors = {
    success: 'bg-[#12B76A]',
    warning: 'bg-[#F79009]',
    error: 'bg-[#F04438]',
    info: 'bg-[#2E90FA]',
    neutral: 'bg-[#667085]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[resolvedVariant]} ${sizeStyles[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[resolvedVariant]}`} />
      <span>{label}</span>
    </span>
  );
};
