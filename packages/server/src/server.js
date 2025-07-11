const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config/config");
const authRoutes = require("./api/routes/auth");
const employeeRoutes = require("./api/routes/employees");
const roleRoutes = require("./api/routes/roles");
const applicationRoutes = require("./api/routes/applications");
const dashboardRoutes = require("./api/routes/dashboard");
const logRoutes = require("./api/routes/logs");
const jiraRoutes = require("./api/routes/jira");
const userRoutes = require("./api/routes/users");

const app = express();

const whitelist = ["http://localhost:3000", config.clientUrl];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// Middlewares
app.use(helmet());
// --- MODIFICATION: ADD THE COOKIE SECRET ---
app.use(cookieParser(config.cookie.secret));
// --- END MODIFICATION ---
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes - CORRECTED
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/jira", jiraRoutes);
app.use("/api/users", userRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});

module.exports = app;
