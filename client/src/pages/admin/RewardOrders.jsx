import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useToast } from "../../hooks/useToast";
import { getAllRewardOrders, updateRewardOrder, deleteRewardOrder, setLocalRewardOrderStatus, optimisticDeleteRewardOrder, restoreRewardOrder } from "../../redux/slices/rewardOrderSlice";
import { getRewardById } from "../../redux/slices/rewardSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";

export default function RewardOrders() {
  const dispatch = useDispatch();
  const { items = [], loading = false } = useSelector(state => state.rewardOrders || {});
  const rewardByIdMap = useSelector((state) => (state.reward ? state.reward.rewardById : {}) || {});
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllRewardOrders());
  }, [dispatch]);

  useEffect(() => {
    // find rewardIds that are not populated and fetch them
    const ids = (items || [])
      .map((i) => (typeof i.rewardId === 'string' ? i.rewardId : i.rewardId?._id))
      .filter(Boolean)
      .filter((id, idx, arr) => arr.indexOf(id) === idx && !rewardByIdMap[id]);
    if (ids.length) {
      ids.forEach((id) => dispatch(getRewardById(id)));
    }
  }, [items, dispatch, rewardByIdMap]);

  // no modal; toasts handled globally

  return (
    <div>
      {/* global toast will render from ToastProvider */}
      <PageMeta title="Reward Orders" description="Manage reward order redemptions" />
      <PageBreadcrumb pageTitle="Reward Orders" />
      <div className="rounded-2xl border p-4 bg-white">
        {loading ? <div>Loading...</div> : (
          <Table rowGap={12}>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>ID</TableCell>
                <TableCell isHeader>User</TableCell>
                <TableCell isHeader>Reward</TableCell>
                <TableCell isHeader>Points Used</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Order ID</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => (
                  <TableRow key={o._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <TableCell className="py-3 px-4">{o._id}</TableCell>
                    <TableCell className="py-3 px-4">{o.userId?.name || o.userId?.email || o.userId?._id}</TableCell>
                    <TableCell className="py-3 px-4 flex items-center gap-3">
                      {(() => {
                        // get reward object either from populated data or from store map
                        const rewardObj = (o.rewardId && typeof o.rewardId === 'object') ? o.rewardId : rewardByIdMap[o.rewardId];
    
                        const label = rewardObj?.name || o.productId?.name || (typeof o.rewardId === 'string' ? o.rewardId : o.rewardId?._id);
                        return (
                          <>
                        
                              <div className="font-semibold">{label}</div>
                         
                          </>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="py-3 px-4">{o.pointsUsed}</TableCell>
                    <TableCell className="py-3 px-4">{o.status}</TableCell>
                    <TableCell className="py-3 px-4">{o.orderId?._id || o.orderId}</TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button onClick={async () => {
                          const prev = o.status;
                          dispatch(setLocalRewardOrderStatus({ id: o._id, status: 'completed' }));
                          toast.showToast({ message: 'Reward marked as completed!', type: 'success' });
                          try {
                            await dispatch(updateRewardOrder({ id: o._id, data: { status: 'completed' } })).unwrap();
                          } catch (err) {
                            // revert
                            dispatch(setLocalRewardOrderStatus({ id: o._id, status: prev }));
                            toast.showToast({ message: 'Failed to update status: ' + (err?.message || err || 'unknown'), type: 'error' });
                          }
                        }}>Complete</Button>
                        <Button onClick={async () => {
                          const prev = o.status;
                          dispatch(setLocalRewardOrderStatus({ id: o._id, status: 'failed' }));
                          toast.showToast({ message: 'Reward marked as failed!', type: 'success' });
                          try {
                            await dispatch(updateRewardOrder({ id: o._id, data: { status: 'failed' } })).unwrap();
                          } catch (err) {
                            // revert
                            dispatch(setLocalRewardOrderStatus({ id: o._id, status: prev }));
                            toast.showToast({ message: 'Failed to update status: ' + (err?.message || err || 'unknown'), type: 'error' });
                          }
                        }}>Fail</Button>
                        <Button variant="outline" onClick={async () => {
                          // optimistic delete
                          const removed = o;
                          dispatch(optimisticDeleteRewardOrder(o._id));
                          toast.showToast({ message: 'Reward order deleted!', type: 'success' });
                          try {
                            await dispatch(deleteRewardOrder(o._id)).unwrap();
                          } catch (err) {
                            // revert on failure
                            dispatch(restoreRewardOrder(removed));
                            toast.showToast({ message: 'Delete failed: ' + (err?.message || err || 'unknown'), type: 'error' });
                          }
                        }}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
