import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { getAllRewardOrders, updateRewardOrder, deleteRewardOrder } from "../../redux/slices/rewardOrderSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import Select from "../../components/form/Select";


const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "canceled", label: "Canceled" },
];

export default function RewardOrders() {
  const dispatch = useDispatch();

  const { items = [], loading } = useSelector((state) => state.rewardOrders);

  const [viewOrder, setViewOrder] = useState(null);

  useEffect(() => {
    dispatch(getAllRewardOrders());
  }, [dispatch]);

  const updateOrderStatus = (id, newStatus) => {
    dispatch(updateRewardOrder({ id, data: { status: newStatus } }));
  };

  const deleteOrder = (id) => {
    dispatch(deleteRewardOrder(id));
  };

  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <div>
      <PageMeta title="Reward Orders" description="Manage reward redemptions" />
      <PageBreadcrumb pageTitle="Reward Orders" />

      <div className="space-y-6">

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/2 sm:p-6">
          <div className="max-w-full overflow-x-auto">

            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 dark:text-white/60 border-y">
                <TableRow>
                  <TableCell isHeader>ORDER ID</TableCell>
                  <TableCell isHeader>CUSTOMER</TableCell>
                  <TableCell isHeader>REWARD</TableCell>
                  <TableCell isHeader>POINTS USED</TableCell>
                  <TableCell isHeader>STATUS</TableCell>
                  <TableCell isHeader>TIME</TableCell>
                  <TableCell isHeader className="text-end">ACTIONS</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800 dark:text-white/70 text-md ">
                {items.map((row) => {
                  const product = row.rewardId?.productId;
                  return (

                    <TableRow key={row._id} className="hover:bg-gray-50  dark:hover:bg-white/5 transition-colors text-center">

                      <TableCell className={"text-xs"}>{row._id}</TableCell>

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
                          color={row.status === "pending" ? "warning" : row.status === "ready" ? "success" : "info"}
                          options={STATUS_OPTIONS}
                          defaultValue={row.status}
                          onChange={(val) => updateOrderStatus(row._id, val)

                          }
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
