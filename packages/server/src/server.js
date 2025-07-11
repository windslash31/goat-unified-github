// packages/server/src/server.js
const config = require("./config/config"); // Import the new config
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser"); // Import cookie-parser

// Import modular routes
const authRoutes = require("./api/routes/auth");
const employeeRoutes = require("./api/routes/employees");
const roleRoutes = require("./api/routes/roles");
const userRoutes = require("./api/routes/users");
const logRoutes = require("./api/routes/logs");
const applicationRoutes = require("./api/routes/applications");
const jiraRoutes = require("./api/routes/jira");
const dashboardRoutes = require("./api/routes/dashboard");

const app = express();
const port = config.port; // Use the port from config

// Setup global middleware
app.use(
  cors({
    origin: config.clientUrl, // Use the client URL from config
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        "'self'",
        "data:",
        "i.pravatar.cc",
        "upload.wikimedia.org",
        "a.slack-edge.com",
        "www.jumpcloud.com",
        "wac-cdn.atlassian.com",
      ],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// --- API Routes ---
app.use("/api", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/jira", jiraRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || "Something went wrong on the server.";
  res.status(status).json({ message });
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
