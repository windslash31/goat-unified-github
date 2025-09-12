const express = require("express");
const router = express.Router();
const jumpcloudExportRoutes = require("./jumpcloudExport");
const googleExportRoutes = require("./googleExport");
const atlassianExportRoutes = require("./atlassianExport");

router.use("/jumpcloud", jumpcloudExportRoutes);
router.use("/google", googleExportRoutes);
router.use("/atlassian", atlassianExportRoutes);

module.exports = router;
