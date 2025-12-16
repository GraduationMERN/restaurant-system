import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../icons/admin-icons";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Checkbox from "../../components/form/input/Checkbox";

import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../redux/slices/ProductSlice";
import { getAllCategories } from "../../redux/slices/CategorySlice";
import { unwrapResult } from "@reduxjs/toolkit";
import { useToast } from "../../hooks/useToast";
import AIProductAutoFill from "../../components/admin/AIProductAutoFill";

/**
 * MenuWithAPI.jsx
 * - Fixes: empty categories dropdown + edit description not visible
 * - Uses productImage as file field (matches your product router)
 */

export default function MenuWithAPI() {
  const dispatch = useDispatch();
  const toast = useToast();

  // Redux state
  // Selectors: return the slice reference directly (do not create new objects inside selector)
  const productState = useSelector((s) => s.product);
  const {
    list: products = [],
    loading: productsLoading,
    error: productsError,
  } = productState || {};

  // Store registers category reducer under `category` (singular) in `store.js`.
  const categoryState = useSelector((s) => s.category);
  const { list: categories = [], loading: categoriesLoading } =
    categoryState || {};

  // UI state
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all' or categoryId
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form initial
  const emptyForm = {
    name: "",
    name_ar: "",
    desc: "",
    desc_ar: "",
    basePrice: "",
    imgURL: "",
    imageFile: null, // local File object -> appended as 'productImage'
    categoryId: "", // will be set when categories load
    stock: 0,
    isnew: false,
    productPoints: 0,
    pointsToPay: 0,
    tags: "",
    options: [],
  };
  const [form, setForm] = useState(emptyForm);

  // fetch categories + products on mount
  useEffect(() => {
    dispatch(getAllCategories());
    dispatch(fetchProducts());
  }, [dispatch]);

  // when categories arrive, ensure form.categoryId has a valid default
  useEffect(() => {
    if (categories && categories.length) {
      setForm((f) => ({ ...f, categoryId: f.categoryId || categories[0]._id }));
      // if filter currently 'all' keep it; otherwise ensure filter id still exists
      if (categoryFilter !== "all") {
        const exists = categories.some((c) => c._id === categoryFilter);
        if (!exists) setCategoryFilter("all");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // filtered products by categoryFilter
  const filtered = useMemo(() => {
    if (!products || products.length === 0) return [];
    if (categoryFilter === "all") return products;
    return products.filter(
      (p) => String(p.categoryId) === String(categoryFilter)
    );
  }, [categoryFilter, products]);

  // helper to update form
  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Options helpers (same as your original behavior)
  const addOption = () =>
    setForm((f) => ({
      ...f,
      options: [
        ...(f.options || []),
        { name: "", name_ar: "", required: false, choices: [] },
      ],
    }));
  const removeOption = (idx) =>
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  const updateOption = (idx, patch) =>
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)),
    }));
  const addChoice = (optIdx) =>
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) =>
        i === optIdx
          ? {
              ...o,
              choices: [
                ...o.choices,
                { label: "", label_ar: "", priceDelta: 0, stock: null },
              ],
            }
          : o
      ),
    }));
  const updateChoice = (optIdx, choiceIdx, patch) =>
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) =>
        i === optIdx
          ? {
              ...o,
              choices: o.choices.map((c, j) =>
                j === choiceIdx ? { ...c, ...patch } : c
              ),
            }
          : o
      ),
    }));
  const removeChoice = (optIdx, choiceIdx) =>
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) =>
        i === optIdx
          ? { ...o, choices: o.choices.filter((_, j) => j !== choiceIdx) }
          : o
      ),
    }));

  // OPEN create modal
  const openCreateModal = () => {
    setEditingId(null);
    setForm((f) => ({ ...emptyForm, categoryId: categories?.[0]?._id || "" }));
    setIsModalOpen(true);
  };

  // OPEN edit modal (populate controlled form properly)
  const openEditModal = (product) => {
    // Map API product fields into our form shape - controlled values
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      name_ar: product.name_ar || "",
      desc: product.desc || "",
      desc_ar: product.desc_ar || "",
      basePrice: product.basePrice != null ? String(product.basePrice) : "",
      imgURL: product.imgURL || "",
      imageFile: null,
      categoryId: product.categoryId || categories?.[0]?._id || "",
      stock: product.stock ?? 0,
      isnew: product.isnew ?? false,
      productPoints: product.productPoints ?? 0,
      pointsToPay: product.pointsToPay ?? 0,
      tags: (product.tags || []).join(", "),
      options: product.options
        ? JSON.parse(JSON.stringify(product.options))
        : [],
    });
    setIsModalOpen(true);
  };

  // Build FormData for create/update. IMPORTANT: backend expects file field name 'productImage'
  const buildFormData = (s) => {
    const fd = new FormData();
    fd.append("name", s.name || "");
    fd.append("desc", s.desc || "");
    fd.append("name_ar", s.name_ar || "");
    fd.append("desc_ar", s.desc_ar || "");
    fd.append("basePrice", String(s.basePrice || 0));
    fd.append("categoryId", s.categoryId || "");
    fd.append("stock", String(s.stock || 0));
    fd.append("isnew", String(!!s.isnew));
    fd.append("productPoints", String(s.productPoints || 0));
    fd.append("pointsToPay", String(s.pointsToPay || 0));

    const tagsArr = s.tags
      ? s.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    fd.append("tags", JSON.stringify(tagsArr));
    fd.append("options", JSON.stringify(s.options || []));

    // file field name must match your router: uploadCloud.single('productImage')
    if (s.imageFile) {
      fd.append("productImage", s.imageFile);
    } else if (s.imgURL) {
      fd.append("imgURL", s.imgURL);
    }

    return fd;
  };

  // Basic validation
  const isFormValid = () => {
    if (!form.name || !form.desc || !form.name_ar || !form.desc_ar)
      return false;
    if (form.basePrice === "" || Number.isNaN(Number(form.basePrice)))
      return false;
    if (!form.categoryId) return false;
    return true;
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!isFormValid()) return;
    setSaving(true);
    const fd = buildFormData(form);
    try {
      if (editingId) {
        const action = await dispatch(
          updateProduct({ id: editingId, productData: fd })
        );
        unwrapResult(action);
      } else {
        const action = await dispatch(createProduct(fd));
        unwrapResult(action);
      }
      // refresh product list to keep state in sync
      await dispatch(fetchProducts());
      setIsModalOpen(false);
      setEditingId(null);
      toast.showToast({
        message: editingId ? "Item updated" : "Item created",
        type: "success",
      });
    } catch (err) {
      // slice contains error message; optionally show toast here
      // console.error(err);
      toast.showToast({ message: "Failed to save item", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Delete with confirmation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    setDeletingId(id);
    try {
      const action = await dispatch(deleteProduct(id));
      unwrapResult(action);
      await dispatch(fetchProducts());
    } catch (err) {
      // console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryName = (id) => {
    const c = categories.find((x) => String(x._id) === String(id));
    return c ? c.name : "Unknown";
  };

  return (
    <>
      <PageMeta title="Menu Management" description="Manage menu items" />
      <PageBreadcrumb pageTitle="Menu Management" />

      <ComponentCard>
        <div className="flex items-center justify-between">
          {/* Category filter using native select to avoid custom Select mismatch */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium mr-2">Filter</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={openCreateModal}>+ Add Item</Button>
        </div>
      </ComponentCard>

      <div className="mt-4">
        {(productsLoading || categoriesLoading) && (
          <div className="p-3 text-sm text-gray-600">Loading...</div>
        )}
        {productsError && (
          <div className="p-3 text-sm text-red-600">Error: {productsError}</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 mt-3">
        {filtered.map((it) => (
          <div
            key={it._id}
            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <img
              src={it.imgURL}
              alt={it.name}
              className="w-full h-36 object-cover rounded-xl"
            />
            <div className="mt-4 flex items-start justify-between">
              <div>
                <h4 className="text-gray-800 font-semibold dark:text-white/90">
                  {it.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {it.desc}
                </p>
              </div>
              <span className="text-gray-800 font-semibold dark:text-white/90">
                ${it.basePrice}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Badge size="sm" variant="light" color="light">
                {getCategoryName(it.categoryId)}
              </Badge>
              <div className="flex items-center gap-3">
                <button
                  className="text-brand-500"
                  title="Edit"
                  onClick={() => openEditModal(it)}
                >
                  <PencilIcon className="size-5" />
                </button>
                <button
                  className="text-error-500"
                  title="Delete"
                  onClick={() => handleDelete(it._id)}
                  disabled={deletingId === it._id}
                >
                  <TrashBinIcon className="size-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: controlled form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-3xl h-100 p-6"
      >
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {editingId ? "Edit Item" : "Add Item"}
          </h3>

          <AIProductAutoFill
            categories={categories}
            sourceFile={form.imageFile}
            onApply={(patch) => {
              setForm((f) => ({ ...f, ...patch }));
            }}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Product name"
              />
            </div>
            <div>
              <Label htmlFor="name_ar">Name (AR)</Label>
              <Input
                id="name_ar"
                value={form.name_ar}
                onChange={(e) => updateField("name_ar", e.target.value)}
                placeholder="اسم المنتج"
              />
            </div>

            <div>
              <Label htmlFor="price">Base Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => updateField("basePrice", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="desc">Description</Label>
              {/* Controlled TextArea - ensures edit shows desc */}
              <TextArea
                rows={3}
                value={form.desc || ""}
                onChange={(val) => updateField("desc", val)}
                placeholder="Short description"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="desc_ar">Description (AR)</Label>
              {/* Controlled TextArea - ensures edit shows desc */}
              <TextArea
                rows={3}
                value={form.desc_ar || ""}
                onChange={(val) => updateField("desc_ar", val)}
                placeholder="الوصف "
              />
            </div>

            <div>
              <Label htmlFor="imgurl">Image URL</Label>
              <Input
                id="imgurl"
                value={form.imgURL}
                onChange={(e) => updateField("imgURL", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="productImage">Or upload image</Label>
              <input
                id="productImage"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  updateField("imageFile", e.target.files?.[0] || null)
                }
              />
              <div className="text-xs text-gray-500 mt-1">
                Uploads sent as <code>productImage</code> (backend expects
                this).
              </div>
            </div>

            <div>
              <Label>Category</Label>
              {/* Native select to ensure value binding correctness */}
              <select
                value={form.categoryId || ""}
                onChange={(e) => updateField("categoryId", e.target.value)}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={String(form.stock ?? "")}
                onChange={(e) =>
                  updateField(
                    "stock",
                    e.target.value === "" ? 0 : Number(e.target.value)
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => updateField("tags", e.target.value)}
                placeholder="spicy, vegan"
              />
            </div>

            <div>
              <Checkbox
                label="New"
                checked={!!form.isnew}
                onChange={(v) => updateField("isnew", v)}
              />
            </div>

            <div>
              <Label htmlFor="pp">Product Points</Label>
              <Input
                id="pp"
                type="number"
                value={String(form.productPoints ?? "")}
                onChange={(e) =>
                  updateField(
                    "productPoints",
                    e.target.value === "" ? 0 : Number(e.target.value)
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="ptp">Points To Pay</Label>
              <Input
                id="ptp"
                type="number"
                value={String(form.pointsToPay ?? "")}
                onChange={(e) =>
                  updateField(
                    "pointsToPay",
                    e.target.value === "" ? 0 : Number(e.target.value)
                  )
                }
              />
            </div>
          </div>

          {/* Options editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">
                Options
              </h4>
              <Button variant="outline" onClick={addOption}>
                + Add Option
              </Button>
            </div>

            {form.options.map((opt, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={opt.name}
                      onChange={(e) =>
                        updateOption(idx, { name: e.target.value })
                      }
                      placeholder="Size"
                    />
                  </div>
                  <div>
                    <Label>Name (Arabic)</Label>
                    <Input
                      value={opt.name_ar}
                      onChange={(e) =>
                        updateOption(idx, { name_ar: e.target.value })
                      }
                      placeholder="الحجم"
                    />
                  </div>
                  <div>
                    <Checkbox
                      label="Required"
                      checked={!!opt.required}
                      onChange={(v) => updateOption(idx, { required: v })}
                    />
                  </div>
                  <div className="md:text-right">
                    <Button variant="outline" onClick={() => removeOption(idx)}>
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Choices
                    </span>
                    <Button variant="outline" onClick={() => addChoice(idx)}>
                      + Add Choice
                    </Button>
                  </div>

                  {opt.choices.map((ch, j) => (
                    <div
                      key={j}
                      className="grid grid-cols-1 gap-3 md:grid-cols-3"
                    >
                      <Input
                        placeholder="Label"
                        value={ch.label}
                        onChange={(e) =>
                          updateChoice(idx, j, { label: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Label(AR)"
                        value={ch.label_ar||""}
                        onChange={(e) =>
                          updateChoice(idx, j, { label_ar: e.target.value })
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price Delta"
                        value={String(ch.priceDelta ?? 0)}
                        onChange={(e) =>
                          updateChoice(idx, j, {
                            priceDelta: Number(e.target.value),
                          })
                        }
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          placeholder="Stock (optional)"
                          value={ch.stock ?? ""}
                          onChange={(e) =>
                            updateChoice(idx, j, {
                              stock:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                        <Button
                          variant="outline"
                          onClick={() => removeChoice(idx, j)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid()}
              loading={saving}
            >
              Save Item
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
