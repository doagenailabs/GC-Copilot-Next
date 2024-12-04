const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    try {
        const config = {
            GCclientId: process.env.GC_CLIENT_ID,
            logsEnabled: process.env.LOGS_ENABLED || 'true',
            maxHistoryMessages: process.env.MAX_HISTORY_MESSAGES || '5'
        };

        // Generate CSRF token
        const csrfToken = jwt.sign(
            { timestamp: Date.now() },
            process.env.CSRF_SECRET_KEY,
            { expiresIn: '1h' }
        );

        // Send the config and csrfToken
        res.status(200).json({
            ...config,
            csrfToken
        });
    } catch (error) {
        console.error('Error in /api/getConfig:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
