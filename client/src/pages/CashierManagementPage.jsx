import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Clock, TrendingUp, Users } from "lucide-react";
import { BookingCard, BookingStatusBadge, Alert } from "../components/tableBooking/BookingComponents";
import { AvailableTablesList, ConfirmationDialog } from "../components/tableBooking/TableComponents";
import { useBookingAPI, useTableAPI } from "../hooks/useBookingAndTableAPI";

/**
 * Cashier Management Dashboard
 * Allows cashiers to:
 * - View today's bookings
 * - View upcoming bookings
 * - Confirm pending bookings
 * - Reject bookings
 * - Mark customers as seated
 * - Complete/mark no-show bookings
 * - Assign tables to bookings
 * - Get table suggestions
 */
export const CashierManagementPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("today");
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [suggestedTables, setSuggestedTables] = useState([]);
  const [showAlert, setShowAlert] = useState(null);

  const {
    fetchToday: fetchTodayBookings,
    fetchUpcoming: fetchUpcomingBookings,
    confirm: confirmBooking,
    reject: rejectBooking,
    markSeated: markSeated,
    complete: completeBooking,
    markNoShow: markNoShowBooking,
    loading: bookingLoading,
    error: bookingError,
  } = useBookingAPI();

  const {
    suggest: suggestTablesAPI,
    loading: tableLoading,
  } = useTableAPI();

  // Get bookings from Redux and restaurantId from auth
  const { todayBookings = [], upcomingBookings = [] } = useSelector(state => state.booking);
  const user = useSelector(state => state.auth?.user);
  const restaurantId = user?.restaurantId || user?._id;

  // Load bookings on mount
  useEffect(() => {
    if (restaurantId) {
      fetchTodayBookings(restaurantId);
      fetchUpcomingBookings(restaurantId);
    }
  }, [restaurantId]);

  const currentBookings = activeTab === "today" ? todayBookings : upcomingBookings;
  const selectedBooking = currentBookings.find(b => b._id === selectedBookingId);

  const handleGetSuggestions = async (bookingId) => {
    try {
      const booking = currentBookings.find(b => b._id === bookingId);
      if (!booking) return;

      if (!restaurantId) {
        setShowAlert({
          type: "error",
          title: "Error",
          message: "Restaurant ID not found",
        });
        return;
      }

      // API expects `time` query param (not `startTime`) — send booking.startTime as `time`
      const suggestions = await suggestTablesAPI({
        restaurantId,
        date: booking.date,
        time: booking.startTime,
        guests: booking.guests,
        durationMinutes: 120,
      });
      // suggestions may be an object containing metadata: { tables: [...], totalCapacity, message }
      const normalized = Array.isArray(suggestions) ? suggestions : (suggestions?.tables ?? []);
      setSuggestedTables(normalized);
      setSelectedBookingId(bookingId);
      setShowTableSelection(true);
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to get table suggestions",
      });
    }
  };

  const handleConfirmBooking = async () => {
    try {
      if (!selectedTableId) {
        setShowAlert({
          type: "error",
          title: "Error",
          message: "Please select a table",
        });
        return;
      }

      await confirmBooking(selectedBookingId, selectedTableId);
      setShowAlert({
        type: "success",
        title: "Success",
        message: "Booking confirmed successfully",
      });
      setShowTableSelection(false);
      setSelectedBookingId(null);
      setSelectedTableId(null);
      if (restaurantId) {
        fetchTodayBookings(restaurantId);
        fetchUpcomingBookings(restaurantId);
      }
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to confirm booking",
      });
    }
  };

  const handleRejectBooking = async () => {
    try {
      await rejectBooking(selectedBookingId);
      setShowAlert({
        type: "success",
        title: "Success",
        message: "Booking rejected",
      });
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setSelectedBookingId(null);
      if (restaurantId) {
        fetchTodayBookings(restaurantId);
        fetchUpcomingBookings(restaurantId);
      }
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to reject booking",
      });
    }
  };

  const handleMarkSeated = async () => {
    try {
      await markSeated(selectedBookingId);
      setShowAlert({
        type: "success",
        title: "Success",
        message: "Customer marked as seated",
      });
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setSelectedBookingId(null);
      if (restaurantId) {
        fetchTodayBookings(restaurantId);
        fetchUpcomingBookings(restaurantId);
      }
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to mark as seated",
      });
    }
  };

  const handleCompleteBooking = async () => {
    try {
      await completeBooking(selectedBookingId);
      setShowAlert({
        type: "success",
        title: "Success",
        message: "Booking completed",
      });
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setSelectedBookingId(null);
      if (restaurantId) {
        fetchTodayBookings(restaurantId);
        fetchUpcomingBookings(restaurantId);
      }
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to complete booking",
      });
    }
  };

  const handleMarkNoShow = async () => {
    try {
      await markNoShowBooking(selectedBookingId);
      setShowAlert({
        type: "success",
        title: "Success",
        message: "Booking marked as no-show",
      });
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setSelectedBookingId(null);
      if (restaurantId) {
        fetchTodayBookings(restaurantId);
        fetchUpcomingBookings(restaurantId);
      }
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to mark as no-show",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Booking Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage today's and upcoming bookings
          </p>
        </div>

        {/* Alerts */}
        {showAlert && (
          <div className="mb-6">
            <Alert
              type={showAlert.type}
              title={showAlert.title}
              message={showAlert.message}
              onClose={() => setShowAlert(null)}
            />
          </div>
        )}

        {bookingError && (
          <div className="mb-6">
            <Alert
              type="error"
              title="Error"
              message={bookingError}
              onClose={() => {}}
            />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border-l-4 border-blue-600">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Bookings</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {todayBookings.length}
                </p>
              </div>
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border-l-4 border-green-600">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Confirmations</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {todayBookings.filter(b => b.status === "pending").length}
                </p>
              </div>
              <Users className="text-green-600" size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border-l-4 border-orange-600">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Seated Customers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {todayBookings.filter(b => b.status === "seated").length}
                </p>
              </div>
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab("today")}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === "today"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Today's Bookings ({todayBookings.length})
                </button>
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === "upcoming"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Upcoming Bookings ({upcomingBookings.length})
                </button>
              </div>

              {/* Bookings List */}
              <div className="p-6">
                {currentBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      {activeTab === "today"
                        ? "No bookings for today"
                        : "No upcoming bookings"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentBookings.map(booking => (
                      <div
                        key={booking._id}
                        onClick={() => setSelectedBookingId(booking._id)}
                        className={`cursor-pointer transition-all ${
                          selectedBookingId === booking._id
                            ? "ring-2 ring-blue-600 rounded-lg"
                            : ""
                        }`}
                      >
                        <BookingCard
                          booking={booking}
                          showActions={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Booking Details & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Booking Details
              </h3>

              {selectedBooking ? (
                <>
                  {/* Booking Info */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedBooking.customerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <BookingStatusBadge status={selectedBooking.status} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedBooking.date} {selectedBooking.startTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Guests</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedBooking.guests} people
                      </p>
                    </div>
                    {selectedBooking.customerPhone && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedBooking.customerPhone}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {selectedBooking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleGetSuggestions(selectedBooking._id)}
                          disabled={bookingLoading || tableLoading}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                        >
                          {tableLoading ? "Suggesting..." : "Confirm & Assign Table"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBookingId(selectedBooking._id);
                            setConfirmAction("reject");
                            setShowConfirmDialog(true);
                          }}
                          disabled={bookingLoading}
                          className="w-full px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium text-sm disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {selectedBooking.status === "confirmed" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBookingId(selectedBooking._id);
                            setConfirmAction("seated");
                            setShowConfirmDialog(true);
                          }}
                          disabled={bookingLoading}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                        >
                          Mark as Seated
                        </button>
                      </>
                    )}

                    {selectedBooking.status === "seated" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBookingId(selectedBooking._id);
                            setConfirmAction("complete");
                            setShowConfirmDialog(true);
                          }}
                          disabled={bookingLoading}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBookingId(selectedBooking._id);
                            setConfirmAction("no-show");
                            setShowConfirmDialog(true);
                          }}
                          disabled={bookingLoading}
                          className="w-full px-4 py-2 border border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg font-medium text-sm disabled:opacity-50"
                        >
                          Mark No-Show
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a booking to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Selection Modal */}
        {showTableSelection && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Select a Table
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {selectedBooking?.guests} guests • {selectedBooking?.date} {selectedBooking?.startTime}
                </p>
                
                <AvailableTablesList
                  tables={suggestedTables}
                  selectedTableId={selectedTableId}
                  onTableSelect={setSelectedTableId}
                  loading={tableLoading}
                />

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      setShowTableSelection(false);
                      setSelectedTableId(null);
                      setSuggestedTables([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!selectedTableId || bookingLoading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {bookingLoading ? "Confirming..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          title={
            confirmAction === "reject"
              ? "Reject Booking"
              : confirmAction === "seated"
              ? "Mark as Seated"
              : confirmAction === "complete"
              ? "Complete Booking"
              : "Mark as No-Show"
          }
          message={
            confirmAction === "reject"
              ? "Are you sure you want to reject this booking? The customer will be notified."
              : confirmAction === "seated"
              ? "Mark this booking as seated?"
              : confirmAction === "complete"
              ? "Mark this booking as completed?"
              : "Mark this booking as no-show?"
          }
          confirmText={
            confirmAction === "reject"
              ? "Reject"
              : confirmAction === "seated"
              ? "Mark Seated"
              : confirmAction === "complete"
              ? "Complete"
              : "No-Show"
          }
          variant={confirmAction === "reject" || confirmAction === "no-show" ? "danger" : "primary"}
          onConfirm={() => {
            if (confirmAction === "reject") handleRejectBooking();
            else if (confirmAction === "seated") handleMarkSeated();
            else if (confirmAction === "complete") handleCompleteBooking();
            else if (confirmAction === "no-show") handleMarkNoShow();
          }}
          onCancel={() => {
            setShowConfirmDialog(false);
            setConfirmAction(null);
          }}
          loading={bookingLoading}
        />
      </div>
    </div>
  );
};

export default CashierManagementPage;
