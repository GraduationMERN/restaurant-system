import React from 'react';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import { ChefHat } from 'lucide-react';

const KitchenHeader = ({
  confirmedOrders,
  preparingOrders,
  readyOrders,
  onRefresh
}) => {
  return (
    <ComponentCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Kitchen Dashboard
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Real-time order preparation
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Confirmed: <span className="font-semibold">{confirmedOrders.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Preparing: <span className="font-semibold">{preparingOrders.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Ready: <span className="font-semibold">{readyOrders.length}</span>
              </span>
            </div>
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
};

export default KitchenHeader;