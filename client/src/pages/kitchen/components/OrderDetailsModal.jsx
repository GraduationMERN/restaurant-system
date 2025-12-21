import React from 'react';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OrderDetailsModal = ({
  viewOrder,
  setViewOrder,
  estimatedTimeInput,
  setEstimatedTimeInput,
  handleUpdateEstimatedTime,
  handleStatusChange,
  handleItemPreparation,
  preparationProgress,
  getStatusColor
}) => {
  const { t } = useTranslation();
  if (!viewOrder) return null;

  return (
    <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} className="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("order_details")}: {viewOrder.orderNumber}
          </h3>
          <button
            onClick={() => setViewOrder(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("customer")}</p>
              <p className="font-medium">{viewOrder.user?.name || viewOrder.customerInfo?.name || t("guest")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("service_type")}</p>
              <p className="font-medium capitalize">{viewOrder.serviceType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("status")}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewOrder.status)}`}>
                {t("admin." + viewOrder.status)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("estimated_time")}</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">{viewOrder.estimatedTime || "15"} {t("min_short")}</span>
                <button
                  onClick={() => {
                    setEstimatedTimeInput(viewOrder.estimatedTime || "");
                    setTimeout(() => document.getElementById('estimatedTimeInput')?.focus(), 100);
                  }}
                  className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  {t("edit")}
                </button>
              </div>
            </div>
          </div>

          {/* Update Estimated Time */}
          {estimatedTimeInput !== "" && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("update_estimated_time")}</p>
              <div className="flex gap-2">
                <input
                  id="estimatedTimeInput"
                  type="number"
                  min="5"
                  max="120"
                  value={estimatedTimeInput}
                  onChange={(e) => setEstimatedTimeInput(e.target.value)}
                  placeholder={t("minutes")}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                />
                <Button
                  onClick={() => handleUpdateEstimatedTime(viewOrder._id)}
                  variant="outline"
                >
                  {t("update")}
                </Button>
                <Button
                  onClick={() => setEstimatedTimeInput("")}
                  variant="ghost"
                >
                  {t("admin.cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* Items with Preparation Controls */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t("items_to_prepare")}</p>
            <div className="space-y-3">
              {viewOrder.type === 'reward' ? (
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          1x {viewOrder.reward?.productId?.name || t("reward_item")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t("reward_redemption")} ({viewOrder.pointsUsed} {t("points")})
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                viewOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      preparationProgress[viewOrder._id]?.[item._id || item.productId]
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.quantity}x {item.name}
                          </span>
                          {preparationProgress[viewOrder._id]?.[item._id || item.productId] && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              {t("prepared")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {t("price")}: {t("currency_egp")} {item.price?.toFixed(2)} {t("each")}
                        </p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t("options")}: {Object.entries(item.selectedOptions).map(([key, val]) => `${key}: ${val}`).join(', ')}
                          </p>
                        )}
                      </div>
                      {viewOrder.status === "preparing" && (
                        <button
                          onClick={() => handleItemPreparation(
                            viewOrder._id,
                            item._id || item.productId,
                            !preparationProgress[viewOrder._id]?.[item._id || item.productId]
                          )}
                          className={`ml-4 p-2 rounded-lg ${
                            preparationProgress[viewOrder._id]?.[item._id || item.productId]
                              ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                          }`}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {(viewOrder.status === "confirmed" || viewOrder.status === "preparing") && (
              <Button
                onClick={() => handleStatusChange(viewOrder._id, viewOrder.status)}
                className={`w-full ${
                  viewOrder.status === "confirmed"
                    ? "bg-purple-500 hover:bg-purple-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {viewOrder.status === "confirmed" ? t("start_preparing_all") : t("mark_entire_ready")}
              </Button>
            )}
            <Button
              onClick={() => setViewOrder(null)}
              variant="outline"
              className="w-full"
            >
              {t("close")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OrderDetailsModal;