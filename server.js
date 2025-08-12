const express = require("express");
const app = express();
const path = require('path');
const sequelize = require("./config/db");
const cookieParser = require('cookie-parser');
const userRouter = require("./routes/userRoutes");
const blogRouter = require("./routes/blogRoutes");

const Blog = require('./models/Blog');
const Sector = require('./models/Sector');
const User = require('./models/User');

const publicBlogMiddleware = require("./middleware/publicBlogMiddleware");
const { rootPage } = require("./controller/userController");


// View & Static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Routes
app.get('/',publicBlogMiddleware,rootPage)
app.use('/users', userRouter);
app.use('/blogs', blogRouter);

// DB connection & server start
const PORT = 3000;
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    await sequelize.sync();
    console.log('Tables synced');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
})();


