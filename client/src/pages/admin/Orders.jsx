import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import DatePicker from "../../components/form/date-picker";
import { useMemo, useState } from "react";
import { Modal } from "../../components/ui/modal";

export default function Orders() {
  const today = new Date();

  const initialOrders = useMemo(
    () => [
      { id: "#1001", customer: "John Doe", itemsCount: 2, total: 24.98, status: "pending", time: "2:30 PM", date: new Date(today.getFullYear(), today.getMonth(), today.getDate()) },
      { id: "#1002", customer: "Jane Smith", itemsCount: 1, total: 18.99, status: "pending", time: "1:45 PM", date: new Date(today.getFullYear(), today.getMonth(), today.getDate()) },
      { id: "#1003", customer: "Mike Johnson", itemsCount: 3, total: 32.5, status: "ready", time: "12:15 PM", date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1) },
      { id: "#1004", customer: "Sarah Wilson", itemsCount: 2, total: 21.98, status: "pending", time: "11:30 AM", date: new Date(today.getFullYear(), today.getMonth(), today.getDate()) },
      { id: "#1005", customer: "Tom Brown", itemsCount: 4, total: 45.5, status: "pending", time: "10:15 AM", date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2) },
    ],
    [today]
  );

  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const statusOk = statusFilter === "all" || o.status === statusFilter;
      const dateOk = !selectedDate || o.date.toDateString() === selectedDate.toDateString();
      return statusOk && dateOk;
    });
  }, [orders, statusFilter, selectedDate]);

  const exportCSV = () => {
    const header = ["Order ID", "Customer", "Items", "Total", "Status", "Category", "Time", "Date"];
    const rows = filtered.map((o) => [o.id, o.customer, o.itemsCount, o.total, o.status, o.category, o.time, o.date.toISOString().slice(0, 10)]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteOrder = (id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "ready", label: "Ready" },
    { value: "completed", label: "Completed" },
  ];


  const updateOrderStatus = (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  return (
    <>
      <PageMeta title="Orders Management" description="Manage customer orders" />
      <PageBreadcrumb pageTitle="Orders Management" />
      <div className="space-y-6">
        <ComponentCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select
                options={[
                  { value: "all", label: "All Orders" },
                  { value: "pending", label: "Pending" },
                  { value: "ready", label: "Ready" },
                  { value: "completed", label: "Completed" },
                  { value: "canceled", label: "Canceled" },
                ]}
                defaultValue="all"
                onChange={(val) => setStatusFilter(val || "all")}
              />
              <div className="w-64">
                <DatePicker id="order-date" placeholder="mm/dd/yyyy" onChange={(dates) => setSelectedDate(dates?.[0] || null)} />
              </div>
            </div>
            <Button onClick={exportCSV}>Export</Button>
          </div>
        </ComponentCard>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">ORDER ID</TableCell>
                  <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">CUSTOMER</TableCell>
                  <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">ITEMS</TableCell>
                  <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">TOTAL</TableCell>
                  <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">STATUS</TableCell>
                  <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">TIME</TableCell>
                  <TableCell isHeader className="py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">ACTIONS</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">{row.id}</TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">{row.customer}</TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">{row.itemsCount} items</TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">${row.total}</TableCell>
                    <TableCell className="py-3">
                      <Select
                        options={STATUS_OPTIONS}
                        defaultValue={row.status}
                        onChange={(val) => updateOrderStatus(row.id, val)}
                        className="w-32"
                        variant="pill"
                        size="sm"
                        color={row.status === "pending" ? "warning" : row.status === "ready" ? "success" : "info"}
                      />
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">{row.time}</TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end gap-4">
                        <button onClick={() => setViewOrder(row)} className="text-brand-500">View</button>
                        <button onClick={() => deleteOrder(row.id)} className="text-error-500">Delete</button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} className="max-w-xl p-6">
        {viewOrder && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Order Details</h3>
            <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p><strong>ID:</strong> {viewOrder.id}</p>
              <p><strong>Customer:</strong> {viewOrder.customer}</p>
              <p><strong>Items:</strong> {viewOrder.itemsCount}</p>
              <p><strong>Total:</strong> ${viewOrder.total}</p>
              <p><strong>Status:</strong> {viewOrder.status}</p>
              <p><strong>Time:</strong> {viewOrder.time}</p>
              <p><strong>Date:</strong> {viewOrder.date.toDateString()}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
