module.exports = (req, res) => {
    const config = {
        GCclientId: process.env.GC_OAUTH_CLIENT_ID,
        logsEnabled: process.env.LOGS_ENABLED,
        maxHistoryMessages: process.env.CONVERSATION_HISTORY_MESSAGES_NUMBER
    };
    
    console.log('API: Returning config:', config);
    
    res.json(config);
};
