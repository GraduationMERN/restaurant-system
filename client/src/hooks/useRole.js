import { useSelector } from "react-redux";
import { useMemo } from "react";

/**
 * Custom hook to check user roles and permissions
 * Memoizes role-derived flags so components don't re-run normalization on every render.
 * @returns {Object} - { isAdmin, isCashier, isKitchen, isCustomer, user }
 */
export const useRole = () => {
  const user = useSelector((state) => state.auth?.user);

  const memo = useMemo(() => {
    const role = (user?.role || "").toString().toLowerCase();
    return {
      isAdmin: role === "admin",
      isCashier: role === "cashier",
      isKitchen: role === "kitchen",
      isCustomer: role === "customer",
      user,
    };
    // Only recompute when user identity or role value changes
  }, [user?.role, user?._id]);

  return memo;
};

/**
 * Check if user has specific role(s)
 * @param {string|string[]} requiredRoles
 * @returns {boolean}
 */
export const useHasRole = (requiredRoles) => {
  const { user } = useSelector((state) => state.auth || {});

  if (!user) return false;

  const roles = Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles];

  const normalized = (user.role || "").toString().toLowerCase();
  return roles.map((r) => r.toString().toLowerCase()).includes(normalized);
};

/**
 * Check if user can perform staff operations (cashier or admin)
 * @returns {boolean}
 */
export const useIsStaff = () => {
  const { isCashier, isAdmin } = useRole();
  return isCashier || isAdmin;
};
