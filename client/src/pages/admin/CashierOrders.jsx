
// src/pages/CashierOrders.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import { 
  fetchCashierOrders, 
  createDirectOrderCashier, 
  cashierUpdateStatus, 
  cashierUpdateEstimatedTime,
  cashierMarkPayment,
  cashierDeleteOrder,
  cashierUpdateCustomerInfo,
  clearCashierMessages,
  filterOrdersByStatus,
  searchOrders,
  clearNewOrderNotification
} from "../../redux/slices/cashierSlice";
import { fetchProducts } from "../../redux/slices/ProductSlice";
import { setupSocketListeners, joinSocketRooms } from "../../utils/socketRedux";
import socketClient from "../../utils/socketRedux";
import { useToast } from "../../hooks/useToast";
import { useRole } from "../../hooks/useRole";
import { Plus, Eye, CheckCircle, Clock, Trash2, DollarSign, RefreshCw, Search, Filter } from "lucide-react";

export default function CashierOrders() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isCashier, isAdmin } = useRole();
  const toast = useToast();

  // Get cashier state (not order state!)
  const { 
    orders, 
    filteredOrders,
    activeOrders,
    pendingOrders,
    loading, 
    error, 
    successMessage,
    newOrderNotification 
  } = useSelector((state) => state.cashier);

  const authUser = useSelector((state) => state.auth.user);

  // State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [refundModalOrder, setRefundModalOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [estimatedTimeInput, setEstimatedTimeInput] = useState("");
  
  // Direct order form
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceType: "dine-in",
    tableNumber: "",
    items: [{ name: "", price: 0, quantity: 1 }],
    notes: ""
  });
  const [showProductPicker, setShowProductPicker] = useState(false);

  const products = useSelector((state) => state.product?.list || []);

  // Initialize socket and fetch orders
  useEffect(() => {
    if (isCashier || isAdmin) {
      // Fetch initial orders
      dispatch(fetchCashierOrders({ status: statusFilter === "all" ? undefined : statusFilter }));

      // Initialize socket
      const socket = socketClient.getSocket() || socketClient.initSocket();
      if (socket) {
        // Setup listeners
        setupSocketListeners(socket);
        
        // Join cashier rooms
        joinSocketRooms(socket, authUser);
        
        // Listen for new order notifications
        socket.on("order:new:paid", (order) => {
          toast.showToast({
            message: `New paid order: ${order.orderNumber}`,
            type: "success",
            duration: 5000
          });
        });
        
        socket.on("order:new:online", (order) => {
          toast.showToast({
            message: `New online order: ${order.orderNumber}`,
            type: "info",
            duration: 5000
          });
        });

        return () => {
          socket.off("order:new:paid");
          socket.off("order:new:online");
        };
      }
    }
  }, [dispatch, isCashier, isAdmin, authUser]);

  // Load products when opening picker
  useEffect(() => {
    if (showProductPicker) {
      dispatch(fetchProducts()).catch(() => {});
    }
  }, [showProductPicker, dispatch]);

  // Clear messages and notifications
  useEffect(() => {
    if (successMessage) {
      toast.showToast({ message: successMessage, type: "success" });
      dispatch(clearCashierMessages());
    }
    if (error) {
      toast.showToast({ message: error, type: "error" });
      dispatch(clearCashierMessages());
    }
  }, [successMessage, error, dispatch, toast]);

  // Auto-clear new order notification after 5 seconds
  useEffect(() => {
    if (newOrderNotification) {
      const timer = setTimeout(() => {
        dispatch(clearNewOrderNotification());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newOrderNotification, dispatch]);

  // Filter and search
  useEffect(() => {
    if (statusFilter !== "all") {
      dispatch(filterOrdersByStatus(statusFilter));
    } else {
      dispatch(filterOrdersByStatus(null));
    }
  }, [statusFilter, dispatch]);

  useEffect(() => {
    dispatch(searchOrders(searchQuery));
  }, [searchQuery, dispatch]);

  // Create direct order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      toast.showToast({ message: "Customer name is required", type: "error" });
      return;
    }

    if (formData.items.length === 0 || formData.items.some(item => !item.name.trim())) {
      toast.showToast({ message: "Please add at least one valid item", type: "error" });
      return;
    }

    const orderData = {
      customerInfo: {
        name: formData.customerName,
        phone: formData.customerPhone,
        email: formData.customerEmail
      },
      serviceType: formData.serviceType,
      tableNumber: formData.serviceType === "dine-in" ? formData.tableNumber : undefined,
      items: formData.items.map(item => ({
        name: item.name,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1
      })),
      notes: formData.notes,
      paymentMethod: "cash",
      paymentStatus: "paid"
    };

    try {
      await dispatch(createDirectOrderCashier(orderData)).unwrap();
      toast.showToast({ message: "Direct order created successfully", type: "success" });
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        serviceType: "dine-in",
        tableNumber: "",
        items: [{ name: "", price: 0, quantity: 1 }],
        notes: ""
      });
      setShowCreateForm(false);
    } catch (err) {
      toast.showToast({ message: err.message || "Failed to create order", type: "error" });
    }
  };

  // Add/remove items in form
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: "", price: 0, quantity: 1 }]
    }));
  };

  const removeItem = (idx) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Order actions
  const handleUpdateStatus = async (orderId, status) => {
    try {
      await dispatch(cashierUpdateStatus({ orderId, status })).unwrap();
      toast.showToast({ message: `Order status updated to ${status}`, type: "success" });
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
      await dispatch(cashierUpdateEstimatedTime({ 
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

  const handleMarkPayment = async (orderId, paymentMethod = "cash") => {
    try {
      await dispatch(cashierMarkPayment({ orderId, paymentMethod })).unwrap();
      toast.showToast({ message: "Payment marked as paid", type: "success" });
      setPaymentModalOrder(null);
    } catch (err) {
      toast.showToast({ message: err.message || "Failed to mark payment", type: "error" });
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await dispatch(cashierDeleteOrder(orderId)).unwrap();
      toast.showToast({ message: "Order deleted successfully", type: "success" });
      setDeleteConfirm(null);
    } catch (err) {
      toast.showToast({ message: err.message || "Failed to delete order", type: "error" });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "confirmed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "preparing": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "ready": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "completed": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (!isCashier && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-error-500">Access Denied: Cashier only</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Cashier Dashboard" description="Manage orders and payments" />
      <PageBreadcrumb pageTitle="Cashier Dashboard" />

      {/* New Order Notification */}
      {newOrderNotification && (
        <div className="mb-4 animate-pulse">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300">
                    New Order: {newOrderNotification.orderNumber}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {newOrderNotification.customerName} • {newOrderNotification.serviceType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dispatch(clearNewOrderNotification())}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Cashier Dashboard</h3>
              <div className="mt-2 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Pending: <span className="font-semibold">{pendingOrders.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Active: <span className="font-semibold">{activeOrders.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-gray-500"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total: <span className="font-semibold">{orders.length}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="h-4 w-4 mr-2" />
                {showCreateForm ? "Cancel" : "Direct Order"}
              </Button>
              <Button 
                onClick={() => dispatch(fetchCashierOrders())}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Create Direct Order Form */}
        {showCreateForm && (
          <ComponentCard>
            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 dark:text-white">Create Direct Order</h4>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service Type
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                  >
                    <option value="dine-in">Dine-in</option>
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              </div>

              {formData.serviceType === "dine-in" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                    placeholder="Table 12"
                  />
                </div>
              )}

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Order Items *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(true)}
                    className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(idx, "name", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                          placeholder="Item name"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(idx, "price", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                          placeholder="Price"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                          placeholder="Qty"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="w-full px-3 py-2 text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                          disabled={formData.items.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Picker Modal (local draft items) */}
              <Modal open={showProductPicker} onClose={() => setShowProductPicker(false)}>
                <div className="p-4">
                  <h3 className="font-semibold mb-3">Add product to order draft</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto">
                    {products && products.length > 0 ? products.map((p) => (
                      <div key={p._id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-gray-500">EGP {p.price || p.basePrice}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              // Append to local formData.items
                              const newItem = { name: p.name, price: p.price || p.basePrice || 0, quantity: 1 };
                              setFormData((fd) => ({ ...fd, items: [...fd.items, newItem] }));
                              toast.showToast({ message: `${p.name} added to draft`, type: 'success' });
                            }}
                            className="px-3 py-2 bg-orange-500 text-white rounded-lg"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-1 text-center text-gray-500 p-4">No products found</div>
                    )}
                  </div>
                  <div className="mt-4 text-right">
                    <button onClick={() => setShowProductPicker(false)} className="px-4 py-2 rounded-lg border">Close</button>
                  </div>
                </div>
              </Modal>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="2"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
                  placeholder="Special instructions..."
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" className="flex-1">
                  Create Order
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </ComponentCard>
        )}

        {/* Filter and Search Bar */}
        <ComponentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order number, customer name, or phone..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Filter className="h-5 w-5 text-gray-500 mt-1" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </ComponentCard>

        {/* Orders Table */}
        <ComponentCard>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No orders found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? "Try a different search term" : "Create a new order to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Order #</TableCell>
                    <TableCell isHeader>Customer</TableCell>
                    <TableCell isHeader>Service</TableCell>
                    <TableCell isHeader>Items</TableCell>
                    <TableCell isHeader>Total</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Payment</TableCell>
                    <TableCell isHeader>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {order.customerInfo?.name || "Guest"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.customerInfo?.phone || "No phone"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{order.serviceType}</span>
                        {order.tableNumber && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Table: {order.tableNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{order.items?.length || 0} items</div>
                        {order.estimatedTime && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {order.estimatedTime} min
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          EGP {order.totalAmount?.toFixed(2) || "0.00"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.paymentStatus === "paid" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewOrder(order)}
                            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {order.paymentStatus !== "paid" && (
                            <button
                              onClick={() => setPaymentModalOrder(order)}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Mark Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {["pending", "confirmed"].includes(order.status) && (
                            <select
                              onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                              className="text-xs border rounded px-2 py-1"
                              defaultValue=""
                            >
                              <option value="" disabled>Status</option>
                              <option value="confirmed">Confirm</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="completed">Complete</option>
                              <option value="cancelled">Cancel</option>
                            </select>
                          )}

                          {["completed", "cancelled"].includes(order.status) && (
                            <button
                              onClick={() => setDeleteConfirm(order)}
                              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ComponentCard>
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
                  {viewOrder.customerInfo?.phone && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{viewOrder.customerInfo.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Service Type</p>
                  <p className="font-medium capitalize">{viewOrder.serviceType}</p>
                  {viewOrder.tableNumber && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Table: {viewOrder.tableNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewOrder.status)}`}>
                    {viewOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payment</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    viewOrder.paymentStatus === "paid" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                  }`}>
                    {viewOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Estimated Time Control */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update Estimated Time</p>
                <div className="flex gap-2">
                  <input
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
                </div>
                {viewOrder.estimatedTime && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Current: {viewOrder.estimatedTime} minutes
                  </p>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Items</p>
                <div className="space-y-2">
                  {viewOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity} × EGP {item.price?.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">EGP {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span>EGP {viewOrder.subtotal?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">VAT</span>
                  <span>EGP {viewOrder.vat?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between font-medium text-lg border-t dark:border-gray-700 pt-2">
                  <span>Total</span>
                  <span>EGP {viewOrder.totalAmount?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} className="max-w-sm">
        {deleteConfirm && (
          <div className="p-6 text-center">
            <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Order?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete order <span className="font-medium">{deleteConfirm.orderNumber}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteConfirm(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteOrder(deleteConfirm._id)}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Delete Order
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={!!paymentModalOrder} onClose={() => setPaymentModalOrder(null)} className="max-w-sm">
        {paymentModalOrder && (
          <div className="p-6 text-center">
            <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Mark as Paid
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Mark order <span className="font-medium">{paymentModalOrder.orderNumber}</span> as paid?
            </p>
            <div className="space-y-3">
              <select
                onChange={(e) => handleMarkPayment(paymentModalOrder._id, e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
              <div className="flex gap-3">
                <Button
                  onClick={() => setPaymentModalOrder(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleMarkPayment(paymentModalOrder._id, "cash")}
                  className="flex-1"
                >
                  Confirm Paid
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}