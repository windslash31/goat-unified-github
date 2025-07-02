const authService = require("../../services/authService");
const employeeService = require("../../services/employeeService");

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await authService.login(email, password, reqContext);
    res.json(result);
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
    const { refreshToken } = req.body; // Expect refresh token in the body for invalidation
    const reqContext = {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      refreshToken,
    }; // Pass refreshToken in reqContext
    // The authService.logout will now handle decoding the accessToken and invalidating both tokens
    await authService.logout(accessToken, reqContext);
    res.status(204).send(); // 204 No Content is appropriate for successful logout
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ message: "Refresh token is required." });
    }
    const newTokens = await authService.refreshAccessToken(token);
    res.json(newTokens);
  } catch (error) {
    res.status(403).json({ message: "Failed to refresh access token." });
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
