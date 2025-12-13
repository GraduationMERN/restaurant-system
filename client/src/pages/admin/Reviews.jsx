import { useEffect, useState, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";
import api from "../../api/axios";
import io from "socket.io-client";
import { format } from "timeago.js";

export default function Reviews() {
  // UI state
  const [filter, setFilter] = useState("newest"); // default: show most recent
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Client-side pagination state
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Socket ref for live updates
  const socketRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL;

  // Fetch all reviews once (we'll paginate on the client)
  async function loadReviews() {
    try {
      setLoading(true);
      const { data } = await api.get("api/reviews", {
        params: {
          // ask backend for a large batch so admin can paginate client-side
          limit: 1000,
          sort: "-createdAt", // newest first
        },
      });
      setReviews(data.reviews || []);
      setPage(1); // reset to first page
    } catch (error) {
      console.error("Failed to load reviews:", error);
      alert("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
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
    loadReviews();

    // Listen for new reviews
    socket.on("new_review", (newReview) => {
      console.log("New review received:", newReview);
      setReviews((prev) => {
        // Check if review already exists to avoid duplicates
        const exists = prev.some((r) => r._id === newReview._id);
        if (exists) return prev;
        return [newReview, ...prev];
      });
    });

    // Listen for review updates (status changes, etc.)
    socket.on("review_updated", (updatedReview) => {
      console.log("Review updated:", updatedReview);
      setReviews((prev) =>
        prev.map((r) =>
          r._id === updatedReview._id ? { ...r, ...updatedReview } : r
        )
      );
    });

    // Listen for review deletions
    socket.on("review_deleted", (reviewId) => {
      console.log("Review deleted:", reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    });

    // Listen for admin notifications
    socket.on("notification", (notification) => {
      console.log("Admin notification:", notification);
      // You can show a toast notification here if needed
      if (notification.type === "review") {
        // Handle review-specific notifications
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off("new_review");
      socket.off("review_updated");
      socket.off("review_deleted");
      socket.off("notification");
      socket.off("connect");
      socket.disconnect();
    };
  }, []);

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  // Filtering
  let filtered = reviews.filter((r) => {
    if (filter === "positive") return r.rating >= 4;
    if (filter === "negative") return r.rating <= 2;
    return true; // base filtering
  });

  // Sorting logic
  if (filter === "newest") {
    filtered = [...filtered].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  if (filter === "oldest") {
    filtered = [...filtered].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }

  // Client-side pagination over the filtered list
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginated = filtered.slice(startIndex, endIndex);

  async function approveReview(review) {
    const confirmApprove = window.confirm(
      `Are you sure you want to approve this review by "${
        review.user?.name || "Anonymous"
      }"?`
    );
    if (!confirmApprove) return;

    try {
      await api.put(`/api/reviews/${review._id}`, { status: "approved" });

      setReviews((prev) =>
        prev.map((r) =>
          r._id === review._id ? { ...r, status: "approved" } : r
        )
      );
    } catch (error) {
      console.error("Failed to approve review:", error);
      alert("Failed to approve review. Please try again.");
    }
  }

  async function rejectReview(review) {
    const confirmReject = window.confirm(
      `Are you sure you want to reject this review by "${
        review.user?.name || "Anonymous"
      }"?`
    );
    if (!confirmReject) return;

    try {
      await api.put(`/api/reviews/${review._id}`, { status: "rejected" });

      setReviews((prev) =>
        prev.map((r) =>
          r._id === review._id ? { ...r, status: "rejected" } : r
        )
      );
    } catch (error) {
      console.error("Failed to reject review:", error);
      alert("Failed to reject review. Please try again.");
    }
  }

  async function deleteReview(id, name) {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this review by "${
        name || "Anonymous"
      }"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Failed to delete review. Please try again.");
    }
  }
  const getInitials = (name) => {
    if (!name) return "anonymous".slice(0, 2).toUpperCase();

    const parts = name.split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !loading) {
      setPage((p) => Math.min(totalPages, p + 1));
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && !loading) {
      setPage((p) => Math.max(1, p - 1));
    }
  };

  if (loading && reviews.length === 0)
    return <p className="text-center">Loading reviews...</p>;

  return (
    <>
      <PageMeta title="Reviews & Feedback" />
      <PageBreadcrumb pageTitle="Reviews & Feedback" />

      <ComponentCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: "all", label: "All Reviews" },
                { value: "positive", label: "Positive (4★+)" },
                { value: "negative", label: "Negative (≤2★)" },
                { value: "newest", label: "Most Recent" },
                { value: "oldest", label: "Oldest" },
              ]}
              defaultValue="newest"
              onChange={setFilter}
              className="w-44"
            />
            <span className="ms-2 text-sm text-gray-500 dark:text-gray-400">
              Average Rating: {avg}/5
            </span>
          </div>

          {/* Simple server-backed pagination controls */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              className={`px-3 py-1 text-sm rounded-md border ${
                currentPage === 1 || loading
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 border-gray-300 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
              }`}
            >
              Previous
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || loading}
              className={`px-3 py-1 text-sm rounded-md border ${
                currentPage >= totalPages || loading
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 border-gray-300 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </ComponentCard>

      <div className="space-y-4">
        {paginated.length === 0 && !loading && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            No reviews found for this page.
          </p>
        )}

        {paginated.map((r) => (
          <div
            key={r._id}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:bg-white/[0.03]"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                {getInitials(r.user?.name)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">
                      {r.user?.name || "Anonymous"}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {format(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < r.rating ? "text-yellow-400" : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-sm">{r.comment}</p>

                {r.photos?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {r.photos?.map((photo) => (
                      <img
                        key={photo.public_id || photo.url}
                        src={photo.url}
                        alt="review"
                        className="h-16 w-16 object-cover rounded cursor-pointer"
                        onClick={() => setSelectedPhoto(photo.url)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {(r.status === "pending" || r.status === "rejected") && (
                  <>
                    <button
                      onClick={() => approveReview(r)}
                      className="text-green-600"
                      title="Approve"
                    >
                      ✓
                    </button>
                  </>
                )}
                <button
                  onClick={() => rejectReview(r)}
                  className="text-yellow-500"
                  title="Reject"
                >
                  ✗
                </button>
                <button
                  onClick={() => deleteReview(r._id, r.user?.name)}
                  className="text-red-500"
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="preview"
            className="max-h-[80%] max-w-[80%] object-contain rounded-lg shadow-lg"
          />
        </div>
      )}
    </>
  );
}
