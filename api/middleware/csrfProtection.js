const jwt = require('jsonwebtoken');

const csrfProtection = (req, res, next) => {
    const token = req.headers['x-csrf-token'];
    if (!token) {
        console.error('CSRF token missing from request headers');
        return res.status(403).json({ error: 'Missing CSRF token' });
    }
    if (!validateToken(token)) {
        console.error('Invalid CSRF token received');
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
};

function validateToken(token) {
    try {
        jwt.verify(token, process.env.CSRF_SECRET_KEY);
        return true;
    } catch (err) {
        console.error('CSRF token validation failed:', err.message);
        return false;
    }
}

module.exports = { csrfProtection };
