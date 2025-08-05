const express = require("express");
const { createBlog, getBlog, getPendingBlogs, getblogPage, getAddSectorPage, addSector, myBlogsPage, getApprovedBlogsPage, getAllPublicApprovedBlogs, getPendingBlogsPage, approveBlog, getBlogDetails } = require("../controller/blogController");
const authenticate = require("../middleware/userMiddleware");
const upload = require('../uploads/upload');
const blogRouter = express();

blogRouter.post("/create",upload.single('image'),authenticate,createBlog);
blogRouter.get("/",authenticate,getBlog);
blogRouter.get("/pending",authenticate,getPendingBlogs);
blogRouter.get("/create-blog",authenticate,getblogPage);
blogRouter.get('/add-sector',authenticate,getAddSectorPage);
blogRouter.get('/add-sector',authenticate,getAddSectorPage);
blogRouter.get('/my-blogs',authenticate,myBlogsPage);
blogRouter.get('/allBlogs',authenticate,getAllPublicApprovedBlogs);
blogRouter.get('/approved-blogs', authenticate, getPendingBlogsPage);
blogRouter.post('/approve/:id', authenticate, approveBlog);
blogRouter.get('/blogs/:id', authenticate,getBlogDetails);


module.exports=blogRouter