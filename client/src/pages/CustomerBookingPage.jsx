import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, AlertCircle, Users, MapPin, Clock, LogIn } from "lucide-react";
import { BookingModal, BookingCard, Alert, BookingStatusBadge } from "../components/tableBooking/BookingComponents";
import { AvailableTablesList } from "../components/tableBooking/TableComponents";
import { useBookingAPI, useTableAPI } from "../hooks/useBookingAndTableAPI";
import { useNavigate } from "react-router-dom";
import socketService from "../services/socketService";
import { updateBookingFromSocket, addBookingFromSocket } from "../redux/slices/bookingSlice";

/**
 * Enhanced Customer Booking Page
 * Allows customers to:
 * - View ALL available tables in a grid layout
 * - See table details (capacity, location, availability)
 * - Select a specific table
 * - Create new bookings with selected table
 * - View their own bookings
 * - Cancel bookings
 * - See real-time booking updates
 */
export const CustomerBookingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [allTables, setAllTables] = useState([]); // All tables for grid display
  const [showAlert, setShowAlert] = useState(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  const {
    create: createBooking,
    fetchCustomer: fetchCustomerBookings,
    cancel: cancelBooking,
    loading: bookingLoading,
    error: bookingError,
  } = useBookingAPI();

  const {
    checkAvailability,
    fetchAll: fetchAllTables,
    loading: tableLoading,
  } = useTableAPI();

  // Get customer bookings from Redux
  const { customerBookings = [], loading: reduxLoading } = useSelector(state => state.booking);
  const user = useSelector(state => state.auth?.user);
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);
  const restaurantId = user?.restaurantId || user?._id;
  // Try multiple email field names: email, userEmail, emailAddress, firebaseUid, or use phone
  const customerEmail = user?.email || user?.userEmail || user?.emailAddress || user?.firebaseUid || user?.phone || user?.phoneNumber;

  // Load customer's bookings and ALL tables on mount
  useEffect(() => {
    // Debug: log user object to see what fields are available
    if (user) {
      console.log('👤 User object:', user);
      console.log('📧 Email field:', customerEmail);
    }
    
    if (isAuthenticated && customerEmail && restaurantId) {
      console.log(' Fetching bookings for:', { customerEmail, restaurantId });
      console.log(' [fetchCustomerBookings] Dispatching thunk with params:', { restaurantId, customerEmail });
      // Fetch bookings for the logged-in user
      fetchCustomerBookings(restaurantId, customerEmail).then(
        (result) => {
          console.log(' [fetchCustomerBookings] Success - received data:', result);
        },
        (error) => {
          console.error(' [fetchCustomerBookings] Error:', error);
        }
      );
    }
  }, [isAuthenticated, customerEmail, restaurantId]);

  // Fetch all tables on mount
  useEffect(() => {
    if (restaurantId) {
      fetchAllTables(restaurantId).catch(err => 
        console.warn('Failed to fetch tables:', err)
      );
    }
  }, [restaurantId]);

  // Setup WebSocket listeners (separate effect to avoid re-running listeners)
  useEffect(() => {
    if (isAuthenticated && customerEmail) {
      console.log('🔌 Setting up WebSocket listeners for:', customerEmail);

      // Setup WebSocket listeners for real-time updates
      const handleBookingUpdated = (updatedBooking) => {
        console.log('📝 Booking updated event received:', updatedBooking);
        // Only update if it's for the logged-in customer
        if (updatedBooking.customerEmail === customerEmail) {
          dispatch(updateBookingFromSocket(updatedBooking));
        }
      };

      const handleBookingNew = (newBooking) => {
        console.log(' New booking event received:', newBooking);
        // Only add if it's for the logged-in customer
        if (newBooking.customerEmail === customerEmail) {
          dispatch(addBookingFromSocket(newBooking));
        }
      };

      socketService.on('booking:updated', handleBookingUpdated);
      socketService.on('booking:new', handleBookingNew);

      // Cleanup listeners on unmount
      return () => {
        socketService.off('booking:updated', handleBookingUpdated);
        socketService.off('booking:new', handleBookingNew);
      };
    }
  }, [isAuthenticated, customerEmail, dispatch]);

  // Refetch bookings when page becomes visible (tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && customerEmail && restaurantId) {
        console.log('👁️ Page visible, refetching bookings...');
        console.log('📌 [visibility refetch] Dispatching fetchCustomerBookings with params:', { restaurantId, customerEmail });
        fetchCustomerBookings(restaurantId, customerEmail);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, customerEmail, restaurantId]);

  // Check availability when date/time/guests change
  useEffect(() => {
    if (selectedDate && selectedTime && selectedGuests && restaurantId) {
      handleCheckAvailability();
    }
  }, [selectedDate, selectedTime, selectedGuests, restaurantId]);

  // Handle table fetching from API
  const handleCheckAvailability = async () => {
    try {
      const tables = await checkAvailability({
        restaurantId: restaurantId,
        date: selectedDate,
        time: selectedTime,
        guests: selectedGuests,
        durationMinutes: 120,
      });
      setAvailableTables(Array.isArray(tables) ? tables : []);
      setSelectedTableId(null);
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to check availability",
      });
      setAvailableTables([]);
    }
  };

  const handleBookingSubmit = async (formData) => {
    try {
      if (!selectedTableId) {
        setShowAlert({
          type: "error",
          title: "Error",
          message: "Please select a table",
        });
        return;
      }

      // Use form email as primary, fall back to logged-in user email if available
      const emailToUse = formData.customerEmail || customerEmail;
      
      if (!emailToUse) {
        setShowAlert({
          type: "error",
          title: "Error",
          message: "Email is required for booking",
        });
        return;
      }

      const bookingData = {
        restaurantId: restaurantId,
        date: selectedDate,
        startTime: selectedTime, // Backend expects startTime, not time
        guests: selectedGuests,
        customerName: formData.customerName,
        customerEmail: emailToUse, // Use form email or logged-in user email
        customerPhone: formData.customerPhone || "", // Include even if empty
        notes: formData.notes || "",
        tableId: selectedTableId || undefined, // Don't include if not selected
        source: "online",
      };

      const newBooking = await createBooking(bookingData);
      
      setShowAlert({
        type: "success",
        title: "Success",
        message: "Booking created successfully! Your booking is pending confirmation.",
      });
      setIsModalOpen(false);
      setSelectedDate("");
      setSelectedTime("");
      setSelectedGuests(2);
      setSelectedTableId(null);
      setAvailableTables([]);
      
      // Refresh bookings for current user
      if (emailToUse && restaurantId) {
        console.log('📌 [post-create] Dispatching fetchCustomerBookings with params:', { restaurantId, customerEmail: emailToUse });
        await fetchCustomerBookings(restaurantId, emailToUse);
      }
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to create booking",
      });
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        // Find the booking to get its email
        const booking = customerBookings.find(b => b._id === bookingId);
        const emailToUse = booking?.customerEmail || customerEmail;
        
        if (!emailToUse) {
          setShowAlert({
            type: "error",
            title: "Error",
            message: "Could not determine booking email",
          });
          return;
        }
        
        await cancelBooking({ bookingId, customerEmail: emailToUse });
        setShowAlert({
          type: "success",
          title: "Success",
          message: "Booking cancelled successfully",
        });
        
        // Refresh bookings for current user
        if (emailToUse && restaurantId) {
          console.log('📌 [post-cancel] Dispatching fetchCustomerBookings with params:', { restaurantId, customerEmail: emailToUse });
          await fetchCustomerBookings(restaurantId, emailToUse);
        }
      } catch (error) {
        setShowAlert({
          type: "error",
          title: "Error",
          message: error.message || "Failed to cancel booking",
        });
      }
    }
  };

  // Check if a table is available based on selected date/time/guests
  const isTableAvailable = (tableId) => {
    if (!selectedDate || !selectedTime) return false;
    return availableTables.some(t => t._id === tableId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Book a Table
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Reserve your perfect table for a great dining experience
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Find Your Table
              </h3>

              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Guests *
                  </label>
                  <select
                    value={selectedGuests}
                    onChange={(e) => setSelectedGuests(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? "guest" : "guests"}</option>
                    ))}
                  </select>
                </div>

                {/* Legend */}
                {selectedDate && selectedTime && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Status Legend
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Not Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Selected</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <button
                  onClick={() => {
                    if (!selectedDate || !selectedTime || !selectedTableId) {
                      setShowAlert({
                        type: "error",
                        title: "Error",
                        message: "Please select date, time, and a table",
                      });
                      return;
                    }
                    setIsModalOpen(true);
                  }}
                  disabled={!selectedDate || !selectedTime || !selectedTableId || bookingLoading}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
                >
                  {bookingLoading ? "Booking..." : "Proceed to Book"}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Available Tables Grid */}
            {selectedDate && selectedTime && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Available Tables for {selectedGuests} {selectedGuests === 1 ? "guest" : "guests"}
                </h3>

                {tableLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Loading tables...</p>
                  </div>
                ) : availableTables.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No tables available for this date and time
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Try selecting a different date or time
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableTables.map(table => (
                      <div
                        key={table._id}
                        onClick={() => setSelectedTableId(table._id)}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTableId === table._id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : isTableAvailable(table._id)
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 hover:border-green-600"
                            : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {/* Selection Indicator */}
                        {selectedTableId === table._id && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}

                        {/* Table Header */}
                        <div className="mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {table.name || `Table ${table._id?.slice(-3)}`}
                          </h4>
                          {isTableAvailable(table._id) && (
                            <div className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs rounded">
                              Available
                            </div>
                          )}
                        </div>

                        {/* Table Details */}
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Capacity: {table.capacity} {table.capacity === 1 ? "person" : "people"}</span>
                          </div>
                          {table.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{table.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <span className={`text-xs font-medium ${
                            isTableAvailable(table._id)
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}>
                            {table.status || "available"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Bookings Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                My Bookings ({customerBookings.length})
              </h3>

              {!isAuthenticated ? (
                <div className="text-center py-12">
                  <LogIn className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Please log in to view your bookings
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Go to Login
                  </button>
                </div>
              ) : reduxLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mt-4">Loading your bookings...</p>
                </div>
              ) : customerBookings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You don't have any bookings yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                    Select a date, time, and table above to create your first booking
                  </p>
                  <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg text-sm">
                    👉 Use the filters on the left to get started
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerBookings.map(booking => (
                    <div
                      key={booking._id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Booking Date & Time */}
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {booking.date} at {booking.startTime || booking.time}
                            </h4>
                          </div>

                          {/* Guests & Table Info */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                            </span>
                            {booking.tableName && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Table: {booking.tableName}
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div>
                            <BookingStatusBadge status={booking.status} />
                          </div>
                        </div>

                        {/* Cancel Button - customers may only cancel pending bookings */}
                        {booking.status === "pending" && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded transition-colors whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleBookingSubmit}
          loading={bookingLoading}
          initialData={{
            customerEmail: customerEmail || "",
          }}
        />
      </div>
    </div>
  );
};

export default CustomerBookingPage;
