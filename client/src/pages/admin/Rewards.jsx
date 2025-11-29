import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
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

const initialPrograms = [
  { name: "Free Dessert", points: 500, type: "dessert", desc: "Get any dessert for free" },
  { name: "10% Off Next Order", points: 750, type: "discount", desc: "Save 10% on your next purchase" },
  { name: "Free Drink", points: 300, type: "drink", desc: "Any beverage on the house" },
  { name: "Free Appetizer", points: 400, type: "appetizer", desc: "Start your meal with a free appetizer" },
];

export default function Rewards() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState({ name: "", points: "", type: "discount", desc: "" });
  const totalPointsIssued = useMemo(() => 45230, []);
  const activeMembers = useMemo(() => 1247, []);
  const rewardsRedeemed = useMemo(() => 892, []);
  const dispatch = useDispatch()
   const { reward, loading, error } = useSelector((state) => state.reward);

   const rewards = reward || []
  useEffect(()=>{
    dispatch(getAllRewards())
    console.log(rewards)
  },[dispatch])
  const iconForType = (type) => {
    if (type === "discount") return <DollarLineIcon className="size-6" />;
    if (type === "drink") return <PlugInIcon className="size-6" />;
    if (type === "appetizer") return <BoxCubeIcon className="size-6" />;
    return <BoxCubeIcon className="size-6" />;
  };

  const openAdd = () => {
    setEditingIndex(null);
    setForm({ name: "", pointsRequired: "", image: "" });
    setIsOpen(true);
  };
  const openEdit = (idx) => {
    const p = rewards[idx];
    setEditingIndex(idx);
    setForm({ name: p.name, points: String(p.pointsRequired || p.points), type: p.type || "discount", desc: p.desc || "" });
    setIsOpen(true);
  };
  const closeModal = () => setIsOpen(false);
  const handleSave = () => {
    const name = form.name.trim();
    const points = Number(form.points);
    if (!name || Number.isNaN(points) || points <= 0) return;
    const payload = { name, pointsRequired: points, type: form.type, desc: form.desc.trim() };
    if (editingIndex !== null) {
      const id = rewards[editingIndex]._id;
      dispatch(updateReward({ id, data: payload }));
    } else {
      dispatch(addReward(payload));
    }
    setIsOpen(false);
  };
  const deleteProgram = (idx) => {
    const id = rewards[idx]._id;
    dispatch(deleteReward(id));
  };

  return (
    <>
      <PageMeta title="Rewards" description="Manage reward programs" />
      <PageBreadcrumb pageTitle="Rewards" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 md:gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <ShootingStarIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Points Issued</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{totalPointsIssued.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Active Members</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{activeMembers.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <CheckCircleIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Rewards Redeemed</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{rewardsRedeemed.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Reward Programs</h3>
        <Button onClick={openAdd} startIcon={<PlusIcon className="size-5" />}>Add Reward</Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rewards.map((p, idx) => (
          <div key={p.name + idx} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between">
              <span className="text-brand-500">
                {iconForType(p.type)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{p.pointsRequired || p.points} pts</span>
            </div>
            <div className="mt-4">
              <h4 className="text-gray-800 font-semibold dark:text-white/90">{p.name}</h4>
              <img src={p.image}></img>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => openEdit(idx)} className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600">
                <PencilIcon className="size-4" />
                Edit
              </button>
              <button onClick={() => deleteProgram(idx)} className="inline-flex items-center gap-1 text-error-500 hover:text-error-600">
                <TrashBinIcon className="size-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal}>
        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{editingIndex !== null ? "Edit Reward" : "Add Reward"}</h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Reward Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Points</Label>
              <Input type="number" value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                options={[
                  { value: "discount", label: "Discount" },
                  { value: "dessert", label: "Dessert" },
                  { value: "drink", label: "Drink" },
                  { value: "appetizer", label: "Appetizer" },
                ]}
                defaultValue={form.type}
                onChange={(val) => setForm((f) => ({ ...f, type: val }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Input value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
