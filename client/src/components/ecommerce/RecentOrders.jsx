import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";

export default function RecentOrders({ orders = [] }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
          <TableRow>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ORDER ID</TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">CUSTOMER</TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ITEMS</TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">TOTAL</TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">STATUS</TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">TIME</TableCell>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
          {orders.map((o) => (
            <TableRow key={o.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{o.id}</TableCell>
              <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{o.customer}</TableCell>
              <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{o.itemsCount}</TableCell>
              <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{o.total}</TableCell>
              <TableCell className="py-3">
                <Badge size="sm" color={o.status === "Completed" ? "success" : o.status === "Ready" ? "info" : o.status === "Pending" ? "warning" : "error"}>{o.status}</Badge>
              </TableCell>
              <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{o.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
