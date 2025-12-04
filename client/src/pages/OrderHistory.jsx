import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { fetchUserOrders } from "../redux/slices/orderSlice";
import { useNavigate } from "react-router-dom";

export default function OrderHistory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userOrders, loading, error } = useSelector((state) => state.order || {});

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <PageMeta title="Order History" description="Your past orders" />
      <PageBreadcrumb pageTitle="My Orders" />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Order History</h2>

          {loading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && userOrders && userOrders.length === 0 && (
            <p className="text-gray-500">You have no past orders</p>
          )}

          {!loading && userOrders && userOrders.length > 0 && (
            <div className="space-y-4">
              {userOrders.map((order) => (
                <div key={order._id} className="p-4 border rounded-lg hover:shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-500">Order</div>
                      <div className="font-mono font-semibold">{order._id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-medium capitalize">{order.status}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm text-gray-600">Items: {order.items?.length || 0}</div>
                    <div className="text-sm font-semibold">EGP {(order.totalAmount || 0).toFixed(2)}</div>
                  </div>

                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      onClick={() => navigate(`/track-order/${order._id}`, { state: { order, orderId: order._id } })}
                      className="px-3 py-2 rounded bg-orange-500 text-white"
                    >
                      Track
                    </button>
                    <button
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="px-3 py-2 rounded border"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
