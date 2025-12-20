import React from 'react';

const LoadingState = () => {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading orders...</p>
      </div>
    </div>
  );
};

export default LoadingState;