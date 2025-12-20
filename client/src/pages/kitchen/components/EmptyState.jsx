import React from 'react';
import { Package } from 'lucide-react';

const EmptyState = ({ filterStatus }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Package className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-gray-500">No orders to prepare</p>
      <p className="text-sm text-gray-400 mt-1">
        {filterStatus === "active" ? "All orders are being processed" : `No ${filterStatus} orders`}
      </p>
    </div>
  );
};

export default EmptyState;