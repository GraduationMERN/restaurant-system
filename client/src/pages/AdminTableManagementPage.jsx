import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Filter } from "lucide-react";
import { FloorPlan, TableManagementForm, ConfirmationDialog } from "../components/tableBooking/TableComponents";
import { Alert } from "../components/tableBooking/BookingComponents";
import { useTableAPI } from "../hooks/useBookingAndTableAPI";

/**
 * Admin Table Management Page
 * Allows admins to:
 * - Create new tables
 * - Edit table details
 * - Delete tables
 * - View floor plan
 * - Configure table settings
 */
export const AdminTableManagementPage = () => {
  const dispatch = useDispatch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [showAlert, setShowAlert] = useState(null);

  const {
    create: createTable,
    fetchAll: fetchTables,
    fetchFloorPlan: fetchFloorPlan,
    update: updateTable,
    delete: deleteTable,
    loading: tableLoading,
    error: tableError,
  } = useTableAPI();

  // Get tables from Redux and restaurantId from auth
  const { tables = [], floorPlan = [] } = useSelector(state => state.table);
  const user = useSelector(state => state.auth?.user);
  const restaurantId = user?.restaurantId || user?._id;

  // Load tables on mount
  useEffect(() => {
    if (restaurantId) {
      fetchTables(restaurantId);
      fetchFloorPlan(restaurantId);
    }
  }, [restaurantId]);

  const uniqueLocations = [...new Set(tables.map(t => t.location).filter(Boolean))];

  // Filter tables
  const filteredTables = tables.filter(table => {
    if (filterStatus !== "all" && table.status !== filterStatus) return false;
    if (filterLocation !== "all" && table.location !== filterLocation) return false;
    return true;
  });

  const handleCreateTable = async (formData) => {
    try {
      // Ensure restaurantId is included in the data
      const tableData = {
        ...formData,
        restaurantId: restaurantId,
      };
      await createTable(tableData);
      setShowAlert({
        type: "success",
        title: "Success",
        message: "Table created successfully",
      });
      setIsFormOpen(false);
      if (restaurantId) {
        fetchTables(restaurantId);
        fetchFloorPlan(restaurantId);
      }
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to create table",
      });
    }
  };

  const handleEditTable = async (formData) => {
    try {
      await updateTable(selectedTableId, formData);
      setShowAlert({
        type: "success",
        title: "Success",
        message: "Table updated successfully",
      });
      setIsFormOpen(false);
      setEditingTable(null);
      setSelectedTableId(null);
      if (restaurantId) {
        fetchTables(restaurantId);
        fetchFloorPlan(restaurantId);
      }
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to update table",
      });
    }
  };

  const handleDeleteTable = async () => {
    try {
      await deleteTable(selectedTableId);
      setShowAlert({
        type: "success",
        title: "Success",
        message: "Table deleted successfully",
      });
      setIsDeleteConfirming(false);
      setSelectedTableId(null);
      if (restaurantId) {
        fetchTables(restaurantId);
        fetchFloorPlan(restaurantId);
      }
    } catch (error) {
      setShowAlert({
        type: "error",
        title: "Error",
        message: error.message || "Failed to delete table",
      });
    }
  };

  const handleEditClick = (tableId) => {
    const table = tables.find(t => t._id === tableId);
    setEditingTable(table);
    setSelectedTableId(tableId);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (tableId) => {
    setSelectedTableId(tableId);
    setIsDeleteConfirming(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTable(null);
    setSelectedTableId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Table Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage restaurant tables and floor plan
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTable(null);
              setSelectedTableId(null);
              setIsFormOpen(true);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            Add Table
          </button>
        </div>

        {/* Alerts */}
        {showAlert && (
          <div className="mb-6">
            <Alert
              type={showAlert.type}
              title={showAlert.title}
              message={showAlert.message}
              onClose={() => setShowAlert(null)}
            />
          </div>
        )}

        {tableError && (
          <div className="mb-6">
            <Alert
              type="error"
              title="Error"
              message={tableError}
              onClose={() => {}}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters & Form */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tables.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Tables</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {tables.filter(t => t.status === "available").length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {tables.filter(t => t.status === "occupied").length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Occupied</p>
                </div>
              </div>

              {/* Form/Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sticky top-8">
                {isFormOpen ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {editingTable ? "Edit Table" : "Create New Table"}
                    </h3>
                    <TableManagementForm
                      initialData={editingTable}
                      onSubmit={editingTable ? handleEditTable : handleCreateTable}
                      onCancel={handleFormClose}
                      loading={tableLoading}
                    />
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Filter size={20} />
                      Filters
                    </h3>

                    <div className="space-y-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="all">All Status</option>
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="reserved">Reserved</option>
                          <option value="cleaning">Cleaning</option>
                        </select>
                      </div>

                      {/* Location Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location
                        </label>
                        <select
                          value={filterLocation}
                          onChange={(e) => setFilterLocation(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="all">All Locations</option>
                          {uniqueLocations.map(location => (
                            <option key={location} value={location}>
                              {location}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing {filteredTables.length} of {tables.length} tables
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Floor Plan */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Floor Plan
              </h3>
              <FloorPlan
                tables={filteredTables}
                selectedTableId={selectedTableId}
                onTableSelect={setSelectedTableId}
                onTableEdit={handleEditClick}
                onTableDelete={handleDeleteClick}
                showActions={true}
                loading={tableLoading}
                columns={3}
              />
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDeleteConfirming}
          title="Delete Table"
          message="Are you sure you want to delete this table? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDeleteTable}
          onCancel={() => {
            setIsDeleteConfirming(false);
            setSelectedTableId(null);
          }}
          loading={tableLoading}
        />
      </div>
    </div>
  );
};

export default AdminTableManagementPage;
