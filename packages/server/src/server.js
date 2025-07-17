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
const { schedulePlatformSync } = require("./cron/platformSync");

const app = express();
app.set("trust proxy", 1);

const whitelist = ["http://localhost:3000"];
if (config.clientUrl) {
  whitelist.push(...config.clientUrl.split(",").map((url) => url.trim()));
}

const corsOptions = {
  // The origin function is more robust for checking against a whitelist.
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // This is important for sending cookies.
};

// Middlewares
app.use(helmet());
app.use(cookieParser(config.cookie.secret));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.options("*", cors(corsOptions));

//routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/jira", jiraRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);

  //if (config.nodeEnv === "production") {
  schedulePlatformSync();
  //}
});

module.exports = app;
