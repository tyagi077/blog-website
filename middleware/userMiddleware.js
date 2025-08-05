const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key';

const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/users/login');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect('/users/login');
  }
};

module.exports = authenticate;
