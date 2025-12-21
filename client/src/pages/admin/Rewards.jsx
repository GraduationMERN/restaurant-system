import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Checkbox from "../../components/form/input/Checkbox";
import { Modal } from "../../components/ui/modal";
import { useMemo, useState } from "react";
import {
  ShootingStarIcon,
  GroupIcon,
  CheckCircleIcon,
  DollarLineIcon,
  BoxCubeIcon,
  PlugInIcon,
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
} from "../../icons/admin-icons";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllRewards, addReward, deleteReward, updateReward } from "../../redux/slices/rewardSlice";
import { getAllRewardOrders } from "../../redux/slices/rewardOrderSlice";
import { fetchProducts } from "../../redux/slices/ProductSlice";
import { useToast } from "../../hooks/useToast";
import { Gift } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Rewards() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState({ isFromProduct: true, productId: "", name: "", points: "", type: "free_product", desc: "", image: null });
  const [saving, setSaving] = useState(false);



  const dispatch = useDispatch()
  const toast = useToast();
  const { reward, loading, error } = useSelector((state) => state.reward);
  const { items: rewardOrders } = useSelector((state) => state.rewardOrders);
  const { list } = useSelector((state) => state.product);

  
  const totalPointsIssued = useMemo(() => {
    return rewardOrders.reduce((sum, order) => sum + (order.pointsUsed || 0), 0);
  }, [rewardOrders]);

  const activeMembers = useMemo(() => {
    const uniqueUsers = new Set(rewardOrders.map(order => order.userId?._id || order.userId));
    return uniqueUsers.size;
  }, [rewardOrders]);
  const rewardsRedeemed = useMemo(() => rewardOrders.length, [rewardOrders]);
  const rewards = reward || []
  useEffect(() => {
    dispatch(getAllRewards())
    dispatch(fetchProducts());
    dispatch(getAllRewardOrders({ page: 1, limit: 1000 }));
  }, [dispatch])


  const iconForType = (type) => {
    if (type === "discount") return <DollarLineIcon className="size-6" />;
    if (type === "drink") return <PlugInIcon className="size-6" />;
    if (type === "appetizer") return <BoxCubeIcon className="size-6" />;
    return <BoxCubeIcon className="size-6" />;
  };

  const openAdd = () => {
    setEditingIndex(null);
    setForm({ isFromProduct: true, productId: "", name: "", points: "", type: "free_product", desc: "", image: null });
    setIsOpen(true);
  };
  const openEdit = (idx) => {
    const r = rewards[idx];
    setEditingIndex(idx);

    setForm({
      isFromProduct: !!r.productId,
      productId: r.productId?._id || "",
      name: r.name || "",
      points: String(r.pointsRequired || r.points || ""),
      type: r.type || "free_product",
      desc: r.desc || "",
      image: null // For edit, maybe not handling image update for now
    });

    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);
  const handleSave = async () => {
    const points = Number(form.points);
    if (Number.isNaN(points) || points <= 0) return;
    if (form.isFromProduct && !form.productId) return;
    if (!form.isFromProduct && !form.name) return;

    const payload = new FormData();
    if (form.isFromProduct) {
      payload.append('productId', form.productId);
    } else {
      payload.append('name', form.name);
      if (form.image) {
        payload.append('image', form.image);
      }
    }
    payload.append('pointsRequired', points);
    payload.append('type', form.type);
    if (form.desc) payload.append('desc', form.desc);

    setSaving(true);
    try {
      if (editingIndex !== null) {
        const id = rewards[editingIndex]._id;
        await dispatch(updateReward({ id, data: payload }));
      } else {
        await dispatch(addReward(payload));
      }
      setIsOpen(false);
      toast.showToast({ message: editingIndex !== null ? t("admin.reward_updated") : t("admin.reward_created"), type: "success" });
    } catch (err) {
      toast.showToast({ message: t("admin.reward_save_fail"), type: "error" });
    } finally {
      setSaving(false);
    }
  };
  const deleteProgram = (idx) => {
    const id = rewards[idx]._id;
    dispatch(deleteReward(id));
  };

  return (
    <>
      <PageMeta title={t("admin.rewards_title")} description={t("admin.rewards_desc")} />
      <PageBreadcrumb pageTitle={t("admin.rewards_title")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 md:gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <ShootingStarIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t("admin.total_points_issued")}</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{totalPointsIssued.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t("admin.active_members")}</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{activeMembers.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <CheckCircleIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t("admin.rewards_redeemed")}</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{rewardsRedeemed.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t("admin.reward_programs")}</h3>
        <Button onClick={openAdd} startIcon={<PlusIcon className="size-5" />}>{t("admin.add_reward")}</Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rewards.map((p, idx) => (
          <div key={p.name + idx} className="rounded-2xl border h-90 border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800">
            {p.image || p.productId?.imgURL ? (
               <div className="w-2/3 sm:w-full sm:h-3/4 flex items-center justify-center p-2">
              <img  className="w-full h-full rounded-xl object-cover shadow-sm"  src={p.image || p.productId?.imgURL} />
              </div>
            ) : (
              <div className="w-2/3 sm:w-full sm:h-3/4 flex items-center justify-center p-2">
              <Gift className="text-gray-400 text-6xl" />
            </div>
            )}
               <div className="flex items-start justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">{p.pointsRequired || p.points} pts</span>
            </div>
            <div className="mt-4">
              <h4 className="text-gray-900 font-semibold dark:text-white/90">{p.productId?.name || p.name}</h4>
             
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button onClick={() => openEdit(idx)} className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600">
                <PencilIcon className="size-4" />
                {t("edit")}
              </button>
              <button onClick={() => deleteProgram(idx)} className="inline-flex items-center gap-1 text-error-500 hover:text-error-600">
                <TrashBinIcon className="size-4" />
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal}>
        <div className="p-6 sm:p-8">
          <h3 className="font-semibold text-gray-800 dark:text-white/90">{editingIndex !== null ? t("admin.edit_reward") : t("admin.add_reward")}</h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Checkbox
                label={t("admin.is_from_product")}
                checked={form.isFromProduct}
                onChange={(checked) => setForm((f) => ({ ...f, isFromProduct: checked }))}
              />
            </div>
            {form.isFromProduct ? (
              <div className="sm:col-span-2">
                <Label>{t("admin.select_product")}</Label>
                <Select
                  options={list.map((p) => ({
                    value: p._id,
                    label: p.name
                  }))}
                  defaultValue={form.productId}
                  onChange={(val) => setForm((f) => ({ ...f, productId: val }))}
                />
              </div>
            ) : (
              <>
                <div className="sm:col-span-2">
                  <Label>{t("admin.reward_name")}</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>{t("admin.reward_image")}</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, image: e.target.files[0] }))} />
                </div>
              </>
            )}
            <div>
              <Label>{t("admin.points")}</Label>
              <Input type="number" value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} />
            </div>

            <div>
              <Label>{t("admin.type")}</Label>
              <Select
                options={[
                  { value: "free_product", label: t("admin.free_product") },
                  { value: "discount", label: t("admin.discount") },
                  { value: "multiplier", label: t("admin.multiplier") },
                  { value: "coupon", label: t("admin.coupon") },
                  { value: "generic", label: t("admin.generic") },
                ]}
                defaultValue={form.type}
                onChange={(val) => setForm((f) => ({ ...f, type: val }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{t("admin.description")}</Label>
              <Input value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={closeModal} disabled={saving}>{t("cancel")}</Button>
            <Button onClick={handleSave} loading={saving}>{t("save")}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
