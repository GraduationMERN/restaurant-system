import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { getAllCategories, addCategory, updateCategory, deleteCategory } from "../../redux/slices/CategorySlice";
import { unwrapResult } from "@reduxjs/toolkit";

export default function Categories() {
  const dispatch = useDispatch();
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
        const action = await dispatch(updateCategory({ id: editing, data: buildFD(form) }));
        unwrapResult(action);
      } else {
        const action = await dispatch(addCategory(buildFD(form)));
        unwrapResult(action);
      }
      await dispatch(getAllCategories());
      setIsOpen(false);
    } catch (err) {
      // handle error (toast)
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Categories</h3>
          <Button onClick={openCreate}>+ Add Category</Button>
        </div>
      </ComponentCard>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <div className="p-3">Loading...</div>}
        {!loading && categories.map((c) => (
          <div key={c._id} className="rounded-lg border p-3 flex items-center gap-3">
            <img src={c.imgURL} alt={c.name} className="w-16 h-16 object-cover rounded-md" />
            <div className="flex-1">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button className="text-brand-500" onClick={() => openEdit(c)}>Edit</button>
              <button className="text-error-500" onClick={() => handleDelete(c._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-md p-6">
        <div className="space-y-4">
          <h4 className="font-semibold">{editing ? "Edit Category" : "Add Category"}</h4>
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Image</Label>
            <input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, imageFile: e.target.files?.[0] || null }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
