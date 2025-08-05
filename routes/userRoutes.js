const express = require("express");
const { createPost, login, addUserPage, loginPage, createUser, logout, profile } = require("../controller/userController");
const authenticate = require("../middleware/userMiddleware");
const upload = require("../uploads/upload");
const userRouter = express();

userRouter.post("/",authenticate,createPost);
userRouter.get("/login",loginPage);
userRouter.post("/login",login);
userRouter.get("/add-user",authenticate,addUserPage);
userRouter.post("/add-user",authenticate, upload.single('image'), createUser); // handle POST
userRouter.get("/logout",logout)
userRouter.get("/profile",authenticate,profile)

module.exports=userRouter