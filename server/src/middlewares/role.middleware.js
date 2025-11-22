const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No role assigned" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: You do not have permission" });
      }

      next();
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

export default roleMiddleware;
