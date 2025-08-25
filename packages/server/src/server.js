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
const dataExportRoutes = require("./api/routes/dataExport");
const userRoutes = require("./api/routes/users");
const managedAccountRoutes = require("./api/routes/managedAccount");
const { schedulePlatformSync } = require("./cron/platformSync");
const syncRoutes = require("./api/routes/sync");
const licenseRoutes = require("./api/routes/licenses");

const db = require("./config/db");

const app = express();
app.set("trust proxy", 1);

const whitelist = ["http://localhost:3000"];
if (config.clientUrl) {
  whitelist.push(...config.clientUrl.split(",").map((url) => url.trim()));
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const resetStaleSyncJobs = async () => {
  try {
    const query = `
      UPDATE sync_jobs 
      SET 
        status = 'FAILED', 
        details = '{"error": "Job failed due to an unexpected server shutdown."}',
        last_failure_at = NOW()
      WHERE status = 'RUNNING';
    `;
    const result = await db.query(query);
    if (result.rowCount > 0) {
      console.log(
        `Reset ${result.rowCount} stale 'RUNNING' sync jobs to 'FAILED'.`
      );
    }
  } catch (error) {
    console.error("Failed to reset stale sync jobs on startup:", error);
  }
};

app.use(helmet());
app.use(cookieParser(config.cookie.secret));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/jira", jiraRoutes);
app.use("/api/users", userRoutes);
app.use("/api/managed-accounts", managedAccountRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/data-export", dataExportRoutes);
app.use("/api/licenses", licenseRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
  resetStaleSyncJobs();

  //if (config.nodeEnv === "production") {
  schedulePlatformSync();
  //}
});

module.exports = app;
