module.exports = function (requiredRole) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Access denied." });
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden. Insufficient permissions." });
    }

    next();
  };
};
