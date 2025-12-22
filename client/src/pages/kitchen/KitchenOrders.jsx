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
  updateItemPreparation,
} from "../../redux/slices/kitchenSlice";
import { setupSocketListeners, joinSocketRooms } from "../../utils/socketRedux";
import socketClient from "../../utils/socketRedux";
import { useRole } from "../../hooks/useRole";
import { useTranslation } from "react-i18next";
import { useToast } from "../../hooks/useToast";
import StaffNavbar from "../../components/StaffNavbar";

import {
  NewOrderAlert,
  KitchenHeader,
  StatsCards,
  FiltersAndControls,
  LoadingState,
  EmptyState,
  OrderCard,
  OrderDetailsModal,
} from "./components";

export default function KitchenOrders() {
  const { t } = useTranslation();
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
    socketConnected,
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
            message: `${t("new_online_order")}: ${order.orderNumber}`,
            type: "info",
            duration: 3000,
          });
        });

        socket.on("order:new:instore", (order) => {
          toast.showToast({
            message: `${t("new_instore_order")}: ${order.orderNumber}`,
            type: "warning",
            duration: 3000,
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
      await dispatch(
        changeOrderStatus({ orderId, status: newStatus })
      ).unwrap();
      toast.showToast({
        message: `${t("order_marked_as")} ${t("admin." + newStatus)}`,
        type: "success",
      });
      setViewOrder(null);
    } catch (err) {
      toast.showToast({
        message: err.message || t("admin.failed_update_status"),
        type: "error",
      });
    }
  };

  const handleUpdateEstimatedTime = async (orderId) => {
    if (!estimatedTimeInput || isNaN(parseInt(estimatedTimeInput))) {
      toast.showToast({ message: t("enter_valid_time"), type: "error" });
      return;
    }

    try {
      await dispatch(
        updateKitchenEstimatedTime({
          orderId,
          estimatedTime: parseInt(estimatedTimeInput),
        })
      ).unwrap();
      toast.showToast({
        message: `${t("estimated_time_updated")} ${estimatedTimeInput} ${t(
          "minutes"
        )}`,
        type: "success",
      });
      setEstimatedTimeInput("");
    } catch (err) {
      toast.showToast({
        message: err.message || t("failed_update_time"),
        type: "error",
      });
    }
  };

  const handleItemPreparation = (orderId, itemId, prepared) => {
    dispatch(updateItemPreparation({ orderId, itemId, prepared }));

    // Update local progress state
    setPreparationProgress((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [itemId]: prepared,
      },
    }));
  };

  // Get filtered orders based on selected filter
  const getFilteredOrders = () => {
    switch (filterStatus) {
      case "confirmed":
        return confirmedOrders;
      case "preparing":
        return preparingOrders;
      case "ready":
        return readyOrders;
      case "active":
        return activeOrders;
      default:
        return activeOrders;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "preparing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPreparationProgress = (orderId) => {
    const order = activeOrders.find((o) => o._id === orderId);
    if (!order) return 0;

    if (order.type === "reward") {
      // For reward orders, check if the single reward item is prepared
      return preparationProgress[orderId]?.["reward"] === true ? 100 : 0;
    }

    if (!order.items) return 0;

    if (order.preparationProgress !== undefined) {
      return order.preparationProgress;
    }

    const preparedItems = order.items.filter(
      (item) =>
        preparationProgress[orderId]?.[item._id || item.productId] === true
    ).length;

    return order.items.length > 0
      ? Math.round((preparedItems / order.items.length) * 100)
      : 0;
  };

  return (
    <>
      <PageMeta
        title={t("kitchen_dashboard")}
        description={t("kitchen_desc")}
      />

      {isAdmin && <PageBreadcrumb pageTitle={t("kitchen_dashboard")} />}
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
    </>
  );
}
