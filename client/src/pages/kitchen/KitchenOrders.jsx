// src/pages/KitchenOrders.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
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
import StaffNavbar from "../../components/StaffNavbar";
import AdminScrollToTopButton from "../../components/common/AdminScrollToTopButton";
import {
  NewOrderAlert,
  KitchenHeader,
  StatsCards,
  FiltersAndControls,
  LoadingState,
  EmptyState,
  OrderCard,
  OrderDetailsModal
} from "./components";

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
      dispatch(fetchKitchenActive());
      const socket = socketClient.getSocket() || socketClient.initSocket();
      if (socket) {
        setupSocketListeners(socket);
        joinSocketRooms(socket, authUser);
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
  const handleStatusChange = async (orderId, currentStatus) => {
    let newStatus;

    // Determine next status based on current status
    if (currentStatus === "confirmed") {
      newStatus = "preparing";
    } else if (currentStatus === "preparing") {
      newStatus = "ready";
    } else {
      // If already ready or any other status, don't change
      return;
    }

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
    if (!order) return 0;
    
    if (order.type === 'reward') {
      // For reward orders, check if the single reward item is prepared
      return preparationProgress[orderId]?.['reward'] === true ? 100 : 0;
    }
    
    if (!order.items) return 0;
    
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

      {isAdmin && <PageBreadcrumb pageTitle="Kitchen Dashboard" />}
      {isKitchen && <StaffNavbar />}

      {/* New Order Alert */}
      <NewOrderAlert
        newOrderAlert={newOrderAlert}
        onDismiss={() => dispatch(clearNewOrderAlert())}
      />

      <div className="space-y-6">
        {/* Header with Stats */}
        <KitchenHeader
          confirmedOrders={confirmedOrders}
          preparingOrders={preparingOrders}
          readyOrders={readyOrders}
          onRefresh={() => dispatch(fetchKitchenActive())}
        />

        {/* Stats Cards */}
        <StatsCards
          confirmedOrders={confirmedOrders}
          preparingOrders={preparingOrders}
          readyOrders={readyOrders}
          avgPreparationTime={stats.avgPreparationTime}
        />

        {/* Filters and Controls */}
        <FiltersAndControls
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* Orders Grid */}
        {loading ? (
          <LoadingState />
        ) : getFilteredOrders().length === 0 ? (
          <EmptyState filterStatus={filterStatus} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {getFilteredOrders().map((order) => {
              const progress = getPreparationProgress(order._id);

              return (
                <OrderCard
                  key={order._id}
                  order={order}
                  progress={progress}
                  getStatusColor={getStatusColor}
                  handleStatusChange={handleStatusChange}
                  handleItemPreparation={handleItemPreparation}
                  preparationProgress={preparationProgress}
                  setViewOrder={setViewOrder}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        viewOrder={viewOrder}
        setViewOrder={setViewOrder}
        estimatedTimeInput={estimatedTimeInput}
        setEstimatedTimeInput={setEstimatedTimeInput}
        handleUpdateEstimatedTime={handleUpdateEstimatedTime}
        handleStatusChange={handleStatusChange}
        handleItemPreparation={handleItemPreparation}
        preparationProgress={preparationProgress}
        getStatusColor={getStatusColor}
      />

      {/* Scroll to Top Button */}
      <AdminScrollToTopButton />
    </>
  );
}