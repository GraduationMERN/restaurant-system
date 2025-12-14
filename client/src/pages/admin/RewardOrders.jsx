import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { getAllRewardOrders, updateRewardOrder, deleteRewardOrder } from "../../redux/slices/rewardOrderSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Select from "../../components/form/Select";
import io from "socket.io-client";
import api from "../../api/axios";

const STATUS_OPTIONS = [
  { value: "Preparing", label: "Preparing" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Ready", label: "Ready" },
  { value: "Completed", label: "Completed" },
];

export default function RewardOrders() {
  const dispatch = useDispatch();
   const socketRef = useRef(null);
  const { items = [], loading } = useSelector((state) => state.rewardOrders);
  const [rewards, setRewards] = useState([]);
  const BASE_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL;
  const [viewOrder, setViewOrder] = useState(null);
  
    async function loadRewards() {
      try {
        const {items} = await api.get("api/reward/reward-order");
        setRewards(items || []);
      } catch (error) {
        console.error("Failed to load reviews:", error);
        alert("Failed to load reviews. Please try again.");
      } 
    }

    useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(BASE_URL);

    const socket = socketRef.current;

    // Register with admin room when connected
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      // Join admin room for notifications
      socket.emit("joinAdmin");
    });

    // Load initial reviews
    loadRewards();
     socket.on("notification", (notification) => {
      console.log("Admin notification:", notification);
      // You can show a toast notification here if needed
      if (notification.type === "reward") {
        // Handle review-specific notifications
        dispatch(getAllRewardOrders());

      }
    });
    // Listen for new reviews
    socket.on("new_reward", (newReview) => {
      console.log("Redeemed reward:", newReview);
      setRewards((prev) => {
        // Check if review already exists to avoid duplicates
        const exists = prev.some((r) => r._id === newReview._id);
        if (exists) return prev;
        return [newReview, ...prev];
      });

      // Send notification for new reward redemption
      if ('serviceWorker' in navigator && 'controller' in navigator.serviceWorker) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'SHOW_NOTIFICATION',
          data: {
            title: '🎉 New Reward Redeemed!',
            body: `${newReview.title || 'A reward'} has been redeemed`,
            tag: `reward-${newReview._id}`,
            data: { rewardId: newReview._id, url: '/admin/reward-orders' }
          }
        });
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off("new_reward");

      socket.off("notification");
      socket.off("connect");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    dispatch(getAllRewardOrders());
  }, [dispatch]);

  const updateOrderStatus = (id, newStatus) => {
    dispatch(updateRewardOrder({ id, data: { status: newStatus } }));
  };

  const deleteOrder = (id) => {
    dispatch(deleteRewardOrder(id));
  };
  const sortedItems = [...items].sort(
  (a, b) => new Date(b.createdAt) - new Date(a.createdAt) // newest first
);
  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <div>
      <PageMeta title="Reward Orders" description="Manage reward redemptions" />
      <PageBreadcrumb pageTitle="Reward Orders" />

      <div className="space-y-6">

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/2 sm:p-6">
          <div className="max-w-full overflow-x-auto">

            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800  dark:text-white/60 border-y">
                <TableRow>
                  <TableCell isHeader>ORDER ID</TableCell>
                  <TableCell isHeader>CUSTOMER</TableCell>
                  <TableCell isHeader>REWARD</TableCell>
                  <TableCell isHeader>POINTS USED</TableCell>
                  <TableCell isHeader>STATUS</TableCell>
                  <TableCell isHeader>TIME</TableCell>
                  <TableCell isHeader className="text-end p-5">ACTIONS</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800 dark:text-white/70 text-md ">
                {sortedItems.map((row) => {
                  const product = row.rewardId?.productId;
                  return (

                    <TableRow key={row._id} className="hover:bg-gray-50  dark:hover:bg-white/5 transition-colors text-center">

                      <TableCell className={"text-xs p-5"}>{row._id}</TableCell>

                      <TableCell>{row.userId?.name || "Unknown"}</TableCell>

                      <TableCell>
                        {product?.name ||
                          row.rewardId?.productId ||
                          "Reward Item"}
                      </TableCell>

                      <TableCell>{row.pointsUsed}</TableCell>

                      <TableCell>
                        <Select
                          className="w-32"
                          variant="pill"
                          size="sm"
                          color={
                            row.status === "Preparing" ? "warning" :
                            row.status === "Confirmed" ? "info" :
                            row.status === "Ready" ? "info" :
                            row.status === "Completed" ? "success" :
                            "neutral"
                          }
                          options={STATUS_OPTIONS}
                          defaultValue={row.status}
                          onChange={(val) => updateOrderStatus(row._id, val)}
                        />
                      </TableCell>

                      <TableCell>{formatDate(row.createdAt)}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-4">
                          <button onClick={() => setViewOrder(row)} className="text-brand-500">
                            View
                          </button>
                          <button onClick={() => deleteOrder(row._id)} className="text-error-500">
                            Delete
                          </button>
                        </div>
                      </TableCell>

                    </TableRow>
                  )
                }
                )}
              </TableBody>
            </Table>

          </div>
        </div>
      </div>

      {/* DETAILS MODAL */}

      {viewOrder && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 dark:text-white/70"
          onClick={() => setViewOrder(null)} // close when clicking outside
        >
          <div
            className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()} // prevent closing on inner click
          >
            {/* Close Button */}
            <button
              onClick={() => setViewOrder(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold mb-4">Order Details</h3>

            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {viewOrder._id}</p>
              <p><strong>Customer:</strong> {viewOrder.userId?.name}</p>
              <p>
                <strong>Reward:</strong>{" "}
                {viewOrder.rewardId?.name ??
                  viewOrder.rewardId?.productId?.name ??
                  "N/A"}
              </p>
              <p><strong>Points Used:</strong> {viewOrder.pointsUsed}</p>
              <p><strong>Status:</strong> {viewOrder.status}</p>
              <p><strong>Redeemed At:</strong> {formatDate(viewOrder.redeemedAt)}</p>
              <p><strong>Created At:</strong> {formatDate(viewOrder.createdAt)}</p>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
