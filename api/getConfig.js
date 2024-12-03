module.exports = (req, res) => {
    res.json({
        GCclientId: process.env.GC_OAUTH_CLIENT_ID,
        logsEnabled: process.env.LOGS_ENABLED
    });
};
