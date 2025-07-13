// packages/server/src/api/controllers/authController.js
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
    const { accessToken, refreshToken } = await authService.login(
      email,
      password,
      reqContext
    );

    // Set refresh token in an httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "none", // Or 'lax' depending on your needs
      path: "/api", // Important to scope the cookie to your API routes
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Only send the access token in the response body
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

    // The refresh token is now in the cookie, which authService will handle
    const { refreshToken } = req.cookies;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };

    await authService.logout(accessToken, refreshToken, reqContext);

    // Clear the httpOnly cookie on the client
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api",
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    // Read the refresh token from the cookie
    const { refreshToken: token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "Refresh token is required." });
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshAccessToken(token);

    // Set the new refresh token in the cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send the new access token
    res.json({ accessToken });
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
