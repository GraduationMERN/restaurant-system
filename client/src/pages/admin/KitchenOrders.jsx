// src/pages/KitchenOrders.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { 
  fetchKitchenActive, 
  changeOrderStatus,
  updateKitchenEstimatedTime,
  clearKitchenMessages,
  sortOrdersBy,
  clearNewOrderAlert,
  updateItemPreparation
} from "../../redux/slices/kitchenSlice";
import { setupSocketListeners, joinSocketRooms } from "../../utils/socketRedux";
import socketClient from "../../utils/socketRedux";
import { useRole } from "../../hooks/useRole";
import { useToast } from "../../hooks/useToast";
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Users, 
  TrendingUp,
  Bell,
  Filter,
  SortAsc
} from "lucide-react";

export default function KitchenOrders() {
  const dispatch = useDispatch();
  const { isKitchen, isAdmin } = useRole();
  const toast = useToast();

  // Get kitchen state (not order state!)
  const {
    activeOrders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    loading,
    error,
    successMessage,
    newOrderAlert,
    stats,
    socketConnected
  } = useSelector((state) => state.kitchen);

  const authUser = useSelector((state) => state.auth.user);

  // State
  const [viewOrder, setViewOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("active");
  const [sortBy, setSortBy] = useState("createdAt");
  const [estimatedTimeInput, setEstimatedTimeInput] = useState("");
  const [preparationProgress, setPreparationProgress] = useState({});

  // Initialize socket and fetch orders
  useEffect(() => {
    if (isKitchen || isAdmin) {
      // Fetch initial orders
      dispatch(fetchKitchenActive());

      // Initialize socket
      const socket = socketClient.getSocket() || socketClient.initSocket();
      if (socket) {
        // Setup listeners
        setupSocketListeners(socket);
        
        // Join kitchen room
        joinSocketRooms(socket, authUser);
        
        // Listen for new order alerts
        socket.on("order:new:online", (order) => {
          toast.showToast({
            message: `New online order: ${order.orderNumber}`,
            type: "info",
            duration: 3000
          });
        });

        socket.on("order:new:instore", (order) => {
          toast.showToast({
            message: `New in-store order: ${order.orderNumber}`,
            type: "warning",
            duration: 3000
          });
        });

        return () => {
          socket.off("order:new:online");
          socket.off("order:new:instore");
        };
      }
    }
  }, [dispatch, isKitchen, isAdmin, authUser]);

  // Clear messages
  useEffect(() => {
    if (successMessage) {
      toast.showToast({ message: successMessage, type: "success" });
      dispatch(clearKitchenMessages());
    }
    if (error) {
      toast.showToast({ message: error, type: "error" });
      dispatch(clearKitchenMessages());
    }
  }, [successMessage, error, dispatch]);

  // Auto-clear new order alert
  useEffect(() => {
    if (newOrderAlert) {
      const timer = setTimeout(() => {
        dispatch(clearNewOrderAlert());
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [newOrderAlert, dispatch]);

  // Sort orders when sortBy changes
  useEffect(() => {
    dispatch(sortOrdersBy({ field: sortBy, ascending: true }));
  }, [sortBy, dispatch]);

  // Order actions
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await dispatch(changeOrderStatus({ orderId, status: newStatus })).unwrap();
      toast.showToast({ 
        message: `Order marked as ${newStatus}`, 
        type: "success" 
      });
      setViewOrder(null);
    } catch (err) {
      toast.showToast({ message: err.message || "Failed to update status", type: "error" });
    }
  };

  const handleUpdateEstimatedTime = async (orderId) => {
    if (!estimatedTimeInput || isNaN(parseInt(estimatedTimeInput))) {
      toast.showToast({ message: "Please enter a valid time in minutes", type: "error" });
      return;
    }

    try {
      await dispatch(updateKitchenEstimatedTime({ 
        orderId, 
        estimatedTime: parseInt(estimatedTimeInput) 
      })).unwrap();
      toast.showToast({ 
        message: `Estimated time updated to ${estimatedTimeInput} minutes`, 
        type: "success" 
      });
      setEstimatedTimeInput("");
    } catch (err) {
      toast.showToast({ message: err.message || "Failed to update estimated time", type: "error" });
    }
  };

  const handleItemPreparation = (orderId, itemId, prepared) => {
    dispatch(updateItemPreparation({ orderId, itemId, prepared }));
    
    // Update local progress state
    setPreparationProgress(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [itemId]: prepared
      }
    }));
  };

  // Get filtered orders based on selected filter
  const getFilteredOrders = () => {
    switch (filterStatus) {
      case "confirmed": return confirmedOrders;
      case "preparing": return preparingOrders;
      case "ready": return readyOrders;
      case "active": return activeOrders;
      default: return activeOrders;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "preparing": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "ready": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPreparationProgress = (orderId) => {
    const order = activeOrders.find(o => o._id === orderId);
    if (!order?.items) return 0;
    
    if (order.preparationProgress !== undefined) {
      return order.preparationProgress;
    }
    
    const preparedItems = order.items.filter(item => 
      preparationProgress[orderId]?.[item._id || item.productId] === true
    ).length;
    
    return order.items.length > 0 ? Math.round((preparedItems / order.items.length) * 100) : 0;
  };

  if (!isKitchen && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-error-500">Access Denied: Kitchen staff only</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Kitchen Dashboard" description="Prepare and manage orders" />
      <PageBreadcrumb pageTitle="Kitchen Dashboard" />

      {/* New Order Alert */}
      {newOrderAlert && (
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
                onClick={() => dispatch(clearNewOrderAlert())}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header with Stats */}
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
                onClick={() => dispatch(fetchKitchenActive())}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComponentCard className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Confirmed Orders</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{confirmedOrders.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </ComponentCard>

          <ComponentCard className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Preparing</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{preparingOrders.length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            </div>
          </ComponentCard>

          <ComponentCard className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Ready for Pickup</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">{readyOrders.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
          </ComponentCard>

          <ComponentCard className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/10 dark:to-amber-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Avg Prep Time</p>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">{stats.avgPreparationTime} min</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 dark:text-amber-400" />
            </div>
          </ComponentCard>
        </div>

        {/* Filters and Controls */}
        <ComponentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {["active", "confirmed", "preparing", "ready"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-brand-500 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800 text-sm"
                >
                  <option value="createdAt">Oldest First</option>
                  <option value="-createdAt">Newest First</option>
                  <option value="estimatedTime">Shortest Time</option>
                  <option value="-estimatedTime">Longest Time</option>
                  <option value="itemsCount">Fewest Items</option>
                  <option value="-itemsCount">Most Items</option>
                </select>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          </div>
        ) : getFilteredOrders().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No orders to prepare</p>
            <p className="text-sm text-gray-400 mt-1">
              {filterStatus === "active" ? "All orders are being processed" : `No ${filterStatus} orders`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {getFilteredOrders().map((order) => {
              const progress = getPreparationProgress(order._id);
              
              return (
                <ComponentCard
                  key={order._id}
                  className="relative border-2 hover:shadow-lg transition-all duration-300"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Order Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        ORDER #{order.orderNumber}
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {order.customerInfo?.name || "Guest"}
                      </p>
                      {order.serviceType && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {order.serviceType} • {order.items?.length || 0} items
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {order.status === "preparing" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Preparation Progress</span>
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
                        {order.estimatedTime || "15"} min
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="max-h-48 overflow-y-auto">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        ITEMS TO PREPARE
                      </p>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.quantity}x {item.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                  <span className="truncate">
                                    {Object.entries(item.selectedOptions).map(([key, val]) => `${key}: ${val}`).join(', ')}
                                  </span>
                                )}
                              </p>
                            </div>
                            {order.status === "preparing" && (
                              <button
                                onClick={() => handleItemPreparation(
                                  order._id, 
                                  item._id || item.productId, 
                                  !preparationProgress[order._id]?.[item._id || item.productId]
                                )}
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
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    {order.status === "confirmed" && (
                      <Button
                        onClick={() => handleStatusChange(order._id, "preparing")}
                        className="w-full bg-purple-500 hover:bg-purple-600"
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        onClick={() => handleStatusChange(order._id, "ready")}
                        className="w-full bg-green-500 hover:bg-green-600"
                      >
                        Mark as Ready
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <div className="text-center px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded font-medium">
                        Ready for Pickup
                      </div>
                    )}
                    <button
                      onClick={() => setViewOrder(order)}
                      className="w-full px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 rounded border border-brand-200 dark:border-brand-800"
                    >
                      View Details
                    </button>
                  </div>
                </ComponentCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} className="max-w-2xl">
        {viewOrder && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Order Details: {viewOrder.orderNumber}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                  <p className="font-medium">{viewOrder.customerInfo?.name || "Guest"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Service Type</p>
                  <p className="font-medium capitalize">{viewOrder.serviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewOrder.status)}`}>
                    {viewOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Time</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{viewOrder.estimatedTime || "15"} min</span>
                    <button
                      onClick={() => {
                        setEstimatedTimeInput(viewOrder.estimatedTime || "");
                        document.getElementById('estimatedTimeInput')?.focus();
                      }}
                      className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Update Estimated Time */}
              {estimatedTimeInput !== "" && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update Estimated Time</p>
                  <div className="flex gap-2">
                    <input
                      id="estimatedTimeInput"
                      type="number"
                      min="5"
                      max="120"
                      value={estimatedTimeInput}
                      onChange={(e) => setEstimatedTimeInput(e.target.value)}
                      placeholder="Minutes"
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                    />
                    <Button
                      onClick={() => handleUpdateEstimatedTime(viewOrder._id)}
                      variant="outline"
                    >
                      Update
                    </Button>
                    <Button
                      onClick={() => setEstimatedTimeInput("")}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Items with Preparation Controls */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Items to Prepare</p>
                <div className="space-y-3">
                  {viewOrder.items?.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border ${
                        preparationProgress[viewOrder._id]?.[item._id || item.productId]
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10"
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
                                Prepared
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Price: EGP {item.price?.toFixed(2)} each
                          </p>
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {Object.entries(item.selectedOptions).map(([key, val]) => (
                                <span 
                                  key={key}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  {key}: {val}
                                </span>
                              ))}
                            </div>
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
                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                            }`}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {viewOrder.status === "confirmed" && (
                  <Button
                    onClick={() => handleStatusChange(viewOrder._id, "preparing")}
                    className="w-full bg-purple-500 hover:bg-purple-600"
                  >
                    Start Preparing All Items
                  </Button>
                )}
                {viewOrder.status === "preparing" && (
                  <Button
                    onClick={() => handleStatusChange(viewOrder._id, "ready")}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    Mark Entire Order as Ready
                  </Button>
                )}
                <Button
                  onClick={() => setViewOrder(null)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}