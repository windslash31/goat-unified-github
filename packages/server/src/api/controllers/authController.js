const authService = require("../../services/authService");
const employeeService = require("../../services/employeeService");
const config = require("../../config/config");

const getCookieOptions = () => {
  const isProduction = config.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "lax",
    path: "/api", // The cookie is valid for all API routes
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const { accessToken, refreshToken } = await authService.login(
      email,
      password,
      reqContext
    );

    // Use the helper function
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    res.json({ accessToken });
  } catch (error) {
    if (
      error.message.includes("Invalid credentials") ||
      error.message.includes("role")
    ) {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];
    const { refreshToken } = req.cookies;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };

    await authService.logout(accessToken, refreshToken, reqContext);

    const clearOptions = { ...getCookieOptions(), maxAge: 0 };
    res.clearCookie("refreshToken", clearOptions);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  const { refreshToken: token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "Refresh token is required." });
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshAccessToken(token);

    res.cookie("refreshToken", newRefreshToken, getCookieOptions());
    res.json({ accessToken });
  } catch (error) {
    if (
      error.message.includes("Invalid refresh token") ||
      error.message.includes("Token has been used") ||
      error.message.includes("Token revoked")
    ) {
      res.clearCookie("refreshToken", { ...getCookieOptions(), maxAge: 0 });
      return res
        .status(403)
        .json({ message: "Invalid refresh token. Please log in again." });
    }

    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res
        .status(404)
        .json({ message: "User account is not linked to an employee record." });
    }
    const employeeData = await employeeService.getEmployeeById(employeeId);
    if (!employeeData) {
      return res.status(404).json({ message: "Employee record not found." });
    }
    res.json(employeeData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  refreshToken,
  getMe,
};
