import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20 rounded-xl">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-slate-700"></div>
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-brand-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
      <p className="text-brand-500 font-medium animate-pulse">Designing your image...</p>
      <p className="text-slate-500 text-sm mt-2">Powered by Gemini 2.5</p>
    </div>
  );
};
