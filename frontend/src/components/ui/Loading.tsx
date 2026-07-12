import React from 'react';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
}

export default function Loading({ fullScreen = true, text }: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
        <div className="spinner" />
        {text && <p className="text-sm text-gray-500">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="spinner" />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
