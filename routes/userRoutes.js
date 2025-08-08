const express = require("express");
const { createPost, login, addUserPage, loginPage, createUser, logout, profile, getAllRegularUsers, editUserPage, updateUser, softDeleteUser, openUpdateProfilePage, updateProfile } = require("../controller/userController");
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
userRouter.get("/users",authenticate,getAllRegularUsers)
userRouter.get("/user/edit/:id",authenticate,editUserPage)
userRouter.post("/user/delete/:id",authenticate,softDeleteUser)

userRouter.post("/update-user/:id",upload.single('image'),updateUser)
userRouter.get("/editProfile/:id",authenticate,openUpdateProfilePage)
userRouter.post("/profile/update",upload.single('image'),authenticate,updateProfile)



module.exports=userRouter