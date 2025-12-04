import { useSelector } from "react-redux";

/**
 * Custom hook to check user roles and permissions
 * @returns {Object} - { isAdmin, isCashier, isKitchen, isCustomer, user }
 */
export const useRole = () => {
  const { user } = useSelector((state) => state.auth);

  return {
    isAdmin: user?.role === "admin",
    isCashier: user?.role === "cashier",
    isKitchen: user?.role === "kitchen",
    isCustomer: user?.role === "customer",
    user,
  };
};

/**
 * Check if user has specific role(s)
 * @param {string|string[]} requiredRoles
 * @returns {boolean}
 */
export const useHasRole = (requiredRoles) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return false;

  const roles = Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles];

  return roles.includes(user.role);
};

/**
 * Check if user can perform staff operations (cashier or admin)
 * @returns {boolean}
 */
export const useIsStaff = () => {
  const { isCashier, isAdmin } = useRole();
  return isCashier || isAdmin;
};
