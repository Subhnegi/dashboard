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
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white transition-all animate-in slide-in-from-bottom-3 duration-200 ${
              isSuccess
                ? 'border-[#A6F4C5] text-[#027A48]'
                : isError
                ? 'border-[#FECDCA] text-[#B42318]'
                : 'border-[#B2DDFF] text-[#175CD3]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#12B76A]" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#F04438]" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#2E90FA]" />}
            </div>

            <div className="flex-1 text-xs font-medium text-[#172033] leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-[#98A2B3] hover:text-[#172033] p-0.5 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
