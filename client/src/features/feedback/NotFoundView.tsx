import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundView: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-6 shadow-xs">
        <Compass className="w-7 h-7" />
      </div>

      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-2">
        404 — Page Not Found
      </span>

      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
        The requested screen does not exist
      </h2>

      <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
        The route you are trying to visit might have been moved, or does not exist in the
        BusinessFlow workspace navigation tree.
      </p>

      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Return to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

