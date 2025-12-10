import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../../redux/slices/CategorySlice";
import { unwrapResult } from "@reduxjs/toolkit";
import { useToast } from "../../hooks/useToast";

export default function Categories() {
  const dispatch = useDispatch();
  const toast = useToast();
  const categoryState = useSelector((s) => s.category) || {};
  const { list: categories = [], loading } = categoryState;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", imageFile: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getAllCategories());
  }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", imageFile: null });
    setIsOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat._id);
    setForm({ name: cat.name || "", imageFile: null });
    setIsOpen(true);
  };

  const buildFD = (s) => {
    const fd = new FormData();
    fd.append("name", s.name || "");
    if (s.imageFile) fd.append("categoryImage", s.imageFile);
    return fd;
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) {
        const action = await dispatch(
          updateCategory({ id: editing, data: buildFD(form) })
        );
        unwrapResult(action);
      } else {
        const action = await dispatch(addCategory(buildFD(form)));
        unwrapResult(action);
      }
      await dispatch(getAllCategories());
      setIsOpen(false);
      toast.showToast({ message: editing ? "Category updated" : "Category created", type: "success" });
    } catch (err) {
      // handle error (toast)
      toast.showToast({ message: "Failed to save category", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      const action = await dispatch(deleteCategory(id));
      unwrapResult(action);
      await dispatch(getAllCategories());
    } catch (err) {}
  };

  return (
    <>
      <PageMeta title="Categories" description="Manage categories" />
      <PageBreadcrumb pageTitle="Categories" />

      <ComponentCard>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Categories</h3>
          <Button onClick={openCreate} className="w-full sm:w-auto">
            + Add Category
          </Button>
        </div>
      </ComponentCard>

      {/* Responsive Grid */}
      <div className="
  mt-4 
  grid 
  grid-cols-1       /* Mobile: 1 card per row */
  sm:grid-cols-2     /* Tablet + Desktop: 2 cards per row */
  gap-4
">

        {loading && <div className="p-3">Loading...</div>}

        {!loading &&
          categories.map((c) => (
            <div
              key={c._id}
              className="rounded-xl border p-4 flex flex-col sm:flex-row items-center gap-4
                       hover:shadow-md transition-all bg-white dark:bg-gray-900"
            >
              {/* Image */}
              <img
                src={c.imgURL}
                alt={c.name}
                className="w-20 h-20 object-cover rounded-md shadow-sm
                         sm:w-16 sm:h-16"
              />

              {/* Text Content */}
              <div className="flex-1 text-center sm:text-left">
                <div className="font-semibold text-base">{c.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                <button
                  className="text-brand-500 hover:text-brand-600 text-sm font-medium px-2 py-1"
                  onClick={() => openEdit(c)}
                >
                  Edit
                </button>
                <button
                  className="text-error-500 hover:text-error-600 text-sm font-medium px-2 py-1"
                  onClick={() => handleDelete(c._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="w-[95%] sm:max-w-md p-6 rounded-xl"
      >
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">
            {editing ? "Edit Category" : "Add Category"}
          </h4>

          {/* Name Field */}
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Image Field */}
          <div className="space-y-1">
            <Label>Image</Label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  imageFile: e.target.files?.[0] || null,
                }))
              }
              className="w-full border dark:border-gray-700 rounded-md p-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
