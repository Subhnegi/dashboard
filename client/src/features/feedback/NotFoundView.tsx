import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundView: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-[#EEECFB] text-[#5546D7] flex items-center justify-center mb-6 shadow-sm">
        <Compass className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold text-[#5546D7] uppercase tracking-wider mb-2">
        404 — Page Not Found
      </span>

      <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight mb-2">
        The requested screen does not exist
      </h2>

      <p className="text-sm text-[#667085] max-w-md mb-8 leading-relaxed">
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
