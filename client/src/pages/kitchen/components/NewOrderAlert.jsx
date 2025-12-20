import React from 'react';
import { Bell } from 'lucide-react';

const NewOrderAlert = ({ newOrderAlert, onDismiss }) => {
  if (!newOrderAlert) return null;

  return (
    <div className="mb-4 animate-pulse">
      <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
              <Bell className="h-4 w-4 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-300">
                New Order: {newOrderAlert.orderNumber}
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {newOrderAlert.itemsCount} items • {newOrderAlert.serviceType}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderAlert;