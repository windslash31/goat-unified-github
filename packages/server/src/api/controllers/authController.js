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

    // Set refreshToken as HttpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return only accessToken in response body
    res.json({ accessToken: result.accessToken });
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
    // Clear the refreshToken cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    // Call logout without refreshToken in reqContext
    const reqContext = {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };
    await authService.logout(accessToken, reqContext);
    res.status(204).send(); // 204 No Content is appropriate for successful logout
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Refresh token is required." });
    }
    const newTokens = await authService.refreshAccessToken(token);

    // Set new refreshToken as HttpOnly cookie
    res.cookie("refreshToken", newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return only new accessToken
    res.json({ accessToken: newTokens.accessToken });
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
