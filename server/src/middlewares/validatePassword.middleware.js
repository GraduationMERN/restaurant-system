export default function validatePassword(req, res, next) {
  const { newPassword, password } = req.body;

  const pwd = newPassword || password;

  if (!pwd) {
    return res.status(400).json({ message: "Password is required" });
  }

  if (pwd.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long",
    });
  }

  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

  if (!hasUppercase) {
    return res.status(400).json({
      message: "Password must contain at least one uppercase letter",
    });
  }

  if (!hasLowercase) {
    return res.status(400).json({
      message: "Password must contain at least one lowercase letter",
    });
  }

  if (!hasNumber) {
    return res.status(400).json({
      message: "Password must contain at least one number",
    });
  }

  if (!hasSymbol) {
    return res.status(400).json({
      message: "Password must contain at least one special character",
    });
  }

  next();
}
