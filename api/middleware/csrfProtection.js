const csrfProtection = (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  if (!token || !validateToken(token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
};
