import React from "react";
import { MapPin, Users, Trash2, Edit2, Check, X } from "lucide-react";
import { TableStatusBadge } from "./BookingComponents";

/**
 * Table Card - Displays table information and status
 */
export const TableCard = ({
  table,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
  isSelected = false,
  showActions = false,
  actionLoading = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected
          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
      } bg-white dark:bg-gray-800`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {table.label || `Table ${table.tableNumber}`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Capacity: {table.capacity} {table.location && `• ${table.location}`}
          </p>
        </div>
        <TableStatusBadge status={table.status} />
      </div>

      {/* Quick Info */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users size={16} />
          <span>Seats {table.capacity} guests</span>
        </div>
        {table.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin size={16} />
            <span>{table.location}</span>
          </div>
        )}
      </div>

      {/* Shape and Features */}
      {(table.shape || table.features?.length > 0) && (
        <div className="mb-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
          {table.shape && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Shape: <span className="capitalize font-medium">{table.shape}</span>
            </p>
          )}
          {table.features?.length > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Features: <span className="font-medium">{table.features.join(", ")}</span>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(table._id);
            }}
            disabled={actionLoading}
            className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-medium rounded disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(table._id);
            }}
            disabled={actionLoading}
            className="flex-1 px-3 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium rounded disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Table Grid/Floor Plan - Displays all tables
 */
export const FloorPlan = ({
  tables,
  selectedTableId,
  onTableSelect,
  onTableEdit,
  onTableDelete,
  showActions = false,
  loading = false,
  columns = 3,
}) => {
  if (loading) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const safeTables = Array.isArray(tables) ? tables : [];
  if (!Array.isArray(tables)) {
    // defensive: log unexpected type to help debugging runtime crashes
    // eslint-disable-next-line no-console
    console.warn("FloorPlan expected 'tables' to be an array but got:", tables);
  }

  if (safeTables.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No tables available</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {safeTables.map((table) => (
        <TableCard
          key={table._id}
          table={table}
          isSelected={selectedTableId === table._id}
          onClick={() => onTableSelect?.(table._id)}
          onEdit={onTableEdit}
          onDelete={onTableDelete}
          showActions={showActions}
          actionLoading={loading}
        />
      ))}
    </div>
  );
};

/**
 * Confirmation Dialog - For destructive actions
 */
export const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  variant = "primary",
}) => {
  if (!isOpen) return null;

  const variantConfig = {
    primary: "bg-blue-600 hover:bg-blue-700",
    danger: "bg-red-600 hover:bg-red-700",
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${
              variantConfig[variant]
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Available Tables List - Shows available tables for a given time/date
 */
export const AvailableTablesList = ({
  tables,
  selectedTableId,
  onTableSelect,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const safeTables = Array.isArray(tables) ? tables : [];
  if (!Array.isArray(tables)) {
    // eslint-disable-next-line no-console
    console.warn("AvailableTablesList expected 'tables' to be an array but got:", tables);
  }

  if (safeTables.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No tables available for this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {safeTables.map((table) => (
        <button
          key={table._id}
          onClick={() => onTableSelect(table._id)}
          className={`w-full p-3 rounded-lg border-2 transition-all ${
            selectedTableId === table._id
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {table.label || `Table ${table.tableNumber}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Capacity: {table.capacity} {table.location ? `• ${table.location}` : ""}
              </p>
            </div>
            {selectedTableId === table._id && <Check size={20} className="text-blue-600" />}
          </div>
        </button>
      ))}
    </div>
  );
};

/**
 * Table Management Form - For creating/editing tables
 */
export const TableManagementForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form, setForm] = React.useState({
    name: initialData?.name || initialData?.tableNumber || "",
    label: initialData?.label || "",
    capacity: initialData?.capacity || 2,
    location: initialData?.location || "",
    shape: initialData?.shape || "round",
    features: initialData?.features || [],
  });

  const [newFeature, setNewFeature] = React.useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value) : value,
    }));
  };

  const handleAddFeature = () => {
    if (newFeature && !form.features.includes(newFeature)) {
      setForm(prev => ({
        ...prev,
        features: [...prev.features, newFeature],
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (feature) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.capacity) {
      alert("Please fill in required fields");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Table Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Table Name *
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          required
        />
      </div>

      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Label (Optional)
        </label>
        <input
          type="text"
          name="label"
          value={form.label}
          onChange={handleChange}
          placeholder="e.g., Window Table, VIP Corner"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        />
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Capacity *
        </label>
        <input
          type="number"
          name="capacity"
          value={form.capacity}
          onChange={handleChange}
          min="1"
          max="20"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          required
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Location
        </label>
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="e.g., Near Window, Patio"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        />
      </div>

      {/* Shape */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Shape
        </label>
        <select
          name="shape"
          value={form.shape}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="round">Round</option>
          <option value="rectangular">Rectangular</option>
          <option value="square">Square</option>
          <option value="bar">Bar</option>
        </select>
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Features
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="e.g., Window view, High chair available"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
          <button
            type="button"
            onClick={handleAddFeature}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
          >
            Add
          </button>
        </div>
        {form.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.features.map(feature => (
              <span
                key={feature}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(feature)}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Table"}
        </button>
      </div>
    </form>
  );
};
