import React from 'react';
import ComponentCard from '../../../components/common/ComponentCard';
import { Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Safe date formatter
const formatOrderTime = (dateValue) => {
  if (!dateValue) return 'N/A';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Date format error:', error);
    return 'N/A';
  }
};

const OrderCard = ({
  order,
  progress,
  getStatusColor,
  handleStatusChange,
  handleItemPreparation,
  preparationProgress,
  setViewOrder
}) => {
  const { t } = useTranslation();

  // Debug log OUTSIDE JSX
  console.log('OrderCard - createdAt:', order.createdAt, 'Type:', typeof order.createdAt);

  return (
    <ComponentCard
      key={order._id}
      className="relative border-2 hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div onClick={() => handleStatusChange(order._id, order.status)}>
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              order.status
            )}`}
          >
            {t("admin." + order.status)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatOrderTime(order.createdAt)}
          </span>
        </div>

        {/* Order Info */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {order.type === 'reward' ? t("reward_redemption_caps") : t("order_caps")} #{order.orderNumber || 'N/A'}
            </p>
            <p className="font-bold text-gray-900 dark:text-white">
              {order.user?.name || order.customerInfo?.name || t("guest")}
            </p>
            {order.type === 'reward' ? (
              <p className="text-sm text-purple-600 dark:text-purple-400">
                {t("reward_redemption")} • {order.pointsUsed || 0} {t("points_used")}
              </p>
            ) : (
              order.serviceType && (
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {t(order.serviceType)} • {order.items?.length || 0} {t("items")}
                </p>
              )
            )}
          </div>

          {/* Progress Bar */}
          {order.status === "preparing" && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{t("preparation_progress")}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Estimated Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">ETA</span>
            </div>
            <span className="font-medium">
              {order.estimatedTime || "15"} {t("min_short")}
            </span>
          </div>

          {/* Items List */}
          <div className="max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t("items_to_prepare")}
            </p>
            <div className="space-y-2">
              {order.type === 'reward' ? (
                <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      1x {order.reward?.productId?.name || t("reward_item")}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {t("reward_redemption")} ({order.pointsUsed || 0} {t("pts")})
                    </p>
                  </div>
                  {order.status === "preparing" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemPreparation(
                          order._id,
                          'reward',
                          !preparationProgress[order._id]?.['reward']
                        );
                      }}
                      className={`ml-2 p-1 rounded ${
                        preparationProgress[order._id]?.['reward']
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                Array.isArray(order.items) && order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.quantity || 1}x {item.name || 'Unknown Item'}
                      </p>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {Object.entries(item.selectedOptions).map(([key, val]) => `${key}: ${val}`).join(', ')}
                        </p>
                      )}
                    </div>
                    {order.status === "preparing" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemPreparation(
                            order._id,
                            item._id || item.productId,
                            !preparationProgress[order._id]?.[item._id || item.productId]
                          );
                        }}
                        className={`ml-2 p-1 rounded ${
                          preparationProgress[order._id]?.[item._id || item.productId]
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Details Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setViewOrder(order);
          }}
          className="w-full px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 rounded border border-brand-200 dark:border-brand-800"
        >
          {t("view_details")}
        </button>
      </div>
    </ComponentCard>
  );
};

export default OrderCard;