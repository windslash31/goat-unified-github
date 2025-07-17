const atlassianService = require("../../services/atlassianService");

const getTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const ticketDetails = await atlassianService.getTicketDetails(ticketId);
    res.json(ticketDetails);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const searchAsset = async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res
        .status(400)
        .json({ message: "Asset name parameter is required." });
    }
    const assetDetails = await atlassianService.findAssetByName(name);
    res.json(assetDetails);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getTicket,
  searchAsset,
};
