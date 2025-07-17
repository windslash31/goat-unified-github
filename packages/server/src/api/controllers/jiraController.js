const atlassianService = require('../../services/atlassianService');

const getTicket = async (req, res, next) => {
    try {
        const { ticketId } = req.params;
        const ticketDetails = await atlassianService.getTicketDetails(ticketId);
        res.json(ticketDetails);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

module.exports = {
    getTicket,
};