import React from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useDemoData();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg bg-white transition-all animate-in slide-in-from-bottom-2 duration-150 ${
              isSuccess
                ? 'border-[#A7F3D0] text-[#065F46]'
                : isError
                ? 'border-[#FECACA] text-[#991B1B]'
                : 'border-[#BAE6FD] text-[#075985]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#059669]" />}
              {isError && <AlertCircle className="w-4 h-4 text-[#DC2626]" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-[#0284C7]" />}
            </div>

            <div className="flex-1 text-xs font-medium text-[#0F172A] leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
