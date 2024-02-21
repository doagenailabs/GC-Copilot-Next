//env vars
module.exports = (req, res) => {
    res.json({
        GCclientId: process.env.GC_OAUTH_CLIENT_ID
    });
};
