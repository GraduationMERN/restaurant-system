const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // For demo: allow all authenticated users access to everything
    next();
  };
};

export default roleMiddleware;
