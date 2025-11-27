import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";
import Badge from "../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../icons/admin-icons";
import { useMemo, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Checkbox from "../../components/form/input/Checkbox";

const allItems = [
  { name: "Margherita Pizza", price: 18.99, category: "meals", img: "/images/grid-image/image-02.png", desc: "Fresh tomatoes, mozzarella, and basil" },
  { name: "Caesar Salad", price: 12.99, category: "meals", img: "/images/grid-image/image-03.png", desc: "Crisp romaine with caesar dressing" },
  { name: "Tiramisu", price: 8.99, category: "desserts", img: "/images/grid-image/image-04.png", desc: "Classic Italian coffee dessert" },
  { name: "Cappuccino", price: 4.99, category: "drinks", img: "/images/grid-image/image-05.png", desc: "Rich espresso with steamed milk" },
  { name: "Pasta Carbonara", price: 16.99, category: "meals", img: "/images/grid-image/image-06.png", desc: "Creamy pasta with pancetta and egg" },
  { name: "Gelato", price: 6.99, category: "desserts", img: "/images/grid-image/image-01.png", desc: "Artisanal Italian ice cream" },
];

export default function Menu() {
  const [category, setCategory] = useState("all");
  const [items, setItems] = useState(allItems);
  const [editingIndex, setEditingIndex] = useState(null);
  const filtered = useMemo(() => {
    if (category === "all") return items;
    return items.filter((i) => i.category === category);
  }, [category, items]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    desc: "",
    basePrice: "",
    imgURL: "",
    category: "meals",
    stock: 0,
    isnew: false,
    productPoints: 0,
    pointsToPay: 0,
    tags: "",
    options: [],
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addOption = () => setForm((f) => ({ ...f, options: [...f.options, { name: "", required: false, choices: [] }] }));
  const removeOption = (idx) => setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  const updateOption = (idx, patch) => setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)) }));
  const addChoice = (optIdx) => setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === optIdx ? { ...o, choices: [...o.choices, { label: "", priceDelta: 0, stock: null }] } : o)) }));
  const updateChoice = (optIdx, choiceIdx, patch) => setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === optIdx ? { ...o, choices: o.choices.map((c, j) => (j === choiceIdx ? { ...c, ...patch } : c)) } : o)) }));
  const removeChoice = (optIdx, choiceIdx) => setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === optIdx ? { ...o, choices: o.choices.filter((_, j) => j !== choiceIdx) } : o)) }));

  const handleSave = () => {
    if (!form.name || !form.desc || !form.basePrice || !form.imgURL) return;
    const newItem = {
      name: form.name,
      price: Number(form.basePrice),
      category: form.category,
      img: form.imgURL,
      desc: form.desc,
      meta: {
        stock: Number(form.stock) || 0,
        isnew: !!form.isnew,
        productPoints: Number(form.productPoints) || 0,
        pointsToPay: Number(form.pointsToPay) || 0,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        options: form.options,
      },
    };
    if (editingIndex !== null) {
      setItems((prev) => prev.map((it, i) => (i === editingIndex ? newItem : it)));
    } else {
      setItems((prev) => [newItem, ...prev]);
    }
    setForm({ name: "", desc: "", basePrice: "", imgURL: "", category: "meals", stock: 0, isnew: false, productPoints: 0, pointsToPay: 0, tags: "", options: [] });
    setEditingIndex(null);
    closeModal();
  };

  const openEdit = (index) => {
    const it = items[index];
    setForm({
      name: it.name || "",
      desc: it.desc || "",
      basePrice: String(it.price ?? ""),
      imgURL: it.img || "",
      category: it.category || "meals",
      stock: it.meta?.stock ?? 0,
      isnew: it.meta?.isnew ?? false,
      productPoints: it.meta?.productPoints ?? 0,
      pointsToPay: it.meta?.pointsToPay ?? 0,
      tags: (it.meta?.tags || []).join(", "),
      options: it.meta?.options ? JSON.parse(JSON.stringify(it.meta.options)) : [],
    });
    setEditingIndex(index);
    openModal();
  };

  const deleteItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <PageMeta title="Menu Management" description="Manage menu items" />
      <PageBreadcrumb pageTitle="Menu Management" />

      <ComponentCard>
        <div className="flex items-center justify-between">
          <Select
            options={[
              { value: "all", label: "All Categories" },
              { value: "meals", label: "Meals" },
              { value: "drinks", label: "Drinks" },
              { value: "desserts", label: "Desserts" },
            ]}
            defaultValue="all"
            onChange={(val) => setCategory(val || "all")}
            className="w-44"
            fullWidth={false}
          />
          <Button onClick={openModal}>+ Add Item</Button>
        </div>
      </ComponentCard>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((it, idx) => (
          <div key={it.name + idx} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <img src={it.img} alt={it.name} className="w-full h-36 object-cover rounded-xl" />
            <div className="mt-4 flex items-start justify-between">
              <div>
                <h4 className="text-gray-800 font-semibold dark:text:white/90">{it.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{it.desc}</p>
              </div>
              <span className="text-gray-800 font-semibold dark:text-white/90">${it.price}</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge size="sm" variant="light" color={it.category === "meals" ? "light" : it.category === "drinks" ? "info" : "warning"}>{it.category[0].toUpperCase() + it.category.slice(1)}</Badge>
              <div className="flex items-center gap-3">
                <button className="text-brand-500" title="Edit" onClick={() => openEdit(items.indexOf(it))}><PencilIcon className="size-5" /></button>
                <button className="text-error-500" title="Delete" onClick={() => deleteItem(items.indexOf(it))}><TrashBinIcon className="size-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-3xl p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Item</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Product name" />
            </div>
            <div>
              <Label htmlFor="price">Base Price</Label>
              <Input id="price" type="number" step="0.01" value={form.basePrice} onChange={(e) => updateField("basePrice", e.target.value)} placeholder="0.00" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <TextArea rows={3} value={form.desc} onChange={(v) => updateField("desc", v)} placeholder="Short description" />
            </div>
            <div>
              <Label htmlFor="img">Image URL</Label>
              <Input id="img" value={form.imgURL} onChange={(e) => updateField("imgURL", e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Category</Label>
              <Select options={[{ value: "meals", label: "Meals" }, { value: "drinks", label: "Drinks" }, { value: "desserts", label: "Desserts" }]} defaultValue={form.category} onChange={(v) => updateField("category", v)} fullWidth={false} className="w-44" />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={form.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="spicy, vegan" />
            </div>
            <div>
              <Checkbox label="New" checked={form.isnew} onChange={(v) => updateField("isnew", v)} />
            </div>
            <div>
              <Label htmlFor="pp">Product Points</Label>
              <Input id="pp" type="number" value={form.productPoints} onChange={(e) => updateField("productPoints", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ptp">Points To Pay</Label>
              <Input id="ptp" type="number" value={form.pointsToPay} onChange={(e) => updateField("pointsToPay", e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Options</h4>
              <Button variant="outline" onClick={addOption}>+ Add Option</Button>
            </div>
            {form.options.map((opt, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
                  <div>
                    <Label>Name</Label>
                    <Input value={opt.name} onChange={(e) => updateOption(idx, { name: e.target.value })} placeholder="Size" />
                  </div>
                  <div>
                    <Checkbox label="Required" checked={opt.required} onChange={(v) => updateOption(idx, { required: v })} />
                  </div>
                  <div className="md:text-right">
                    <Button variant="outline" onClick={() => removeOption(idx)}>Remove</Button>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Choices</span>
                    <Button variant="outline" onClick={() => addChoice(idx)}>+ Add Choice</Button>
                  </div>
                  {opt.choices.map((ch, j) => (
                    <div key={j} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Input placeholder="Label" value={ch.label} onChange={(e) => updateChoice(idx, j, { label: e.target.value })} />
                      <Input type="number" step="0.01" placeholder="Price Delta" value={ch.priceDelta} onChange={(e) => updateChoice(idx, j, { priceDelta: Number(e.target.value) })} />
                      <div className="flex items-center gap-3">
                        <Input type="number" placeholder="Stock (optional)" value={ch.stock ?? ""} onChange={(e) => updateChoice(idx, j, { stock: e.target.value === "" ? null : Number(e.target.value) })} />
                        <Button variant="outline" onClick={() => removeChoice(idx, j)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave}>Save Item</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
