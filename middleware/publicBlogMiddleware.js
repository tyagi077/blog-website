const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key';

const publicBlogMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  try {
    if(token){
      const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
    }else{
      req.user=null;
      next();
    }
    
  } catch (err) {
    
    return res.redirect('/users/login');
  }
};

module.exports=publicBlogMiddleware