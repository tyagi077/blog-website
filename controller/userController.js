const User = require('../models/User');
const { Sector } = require('../models');
const jwt = require("jsonwebtoken");
const JWT_SECRET = 'your_jwt_secret_key';
const fs = require('fs');
const path = require('path');
const UserSector = require("../models/UserSector")
const { Op } = require('sequelize');

const createPost = async (req, res) => {
  try {
    const { name, email, password, image, role, created_by } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      image,
      role,
      created_by
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email, is_deleted: false } });

    if (!user || user.password !== password) {
      return res.status(401).render('login', {
        error: 'Invalid email or password',
        user: null
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Store token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Redirect to dashboard
    res.redirect('/blogs/allBlogs');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('login', { error: 'Server error', user: null });
  }
};
const createUser = async (req, res) => {
  try {
    console.log("🔥 Incoming createUser request");

    const created_by = req.user?.id;
    console.log("🧾 Authenticated User ID (created_by):", created_by);

    const { name, email, password, role } = req.body;
    console.log("📦 Form Data:", { name, email, password, role });

    const imagePath = req.file ? '/uploads/' + req.file.filename : null;
    console.log("🖼️ Uploaded Image Path:", imagePath);

    // Check if all required fields are present
    if (!created_by || !name || !email || !password || !role) {
      console.error("❌ Missing required fields");
      return res.status(400).send("Missing required fields");
    }

    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      image: imagePath,
      created_by
    });

    console.log("✅ User created:", newUser.toJSON());

    // If admin and sectors were selected, create sector links
    if (role === 'admin' && req.body.sectors) {
      const sectors = Array.isArray(req.body.sectors)
        ? req.body.sectors
        : [req.body.sectors];

      const sectorLinks = sectors.map(sectorId => ({
        user_id: newUser.id,
        sector_id: sectorId
      }));

      console.log("🔗 Sector links to insert:", sectorLinks);

      await UserSector.bulkCreate(sectorLinks);
      console.log("✅ Sector links inserted");
    }

    res.redirect('/users/users');
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).send('Failed to create user');
  }
};
const loginPage = async (req, res) => {
  res.render('login', { user: null })
};
const addUserPage = async (req, res) => {
  const sectors = await Sector.findAll();
  res.render('addUser', { editUser: null, userSectors: null, sectors, user: req.user });
};
const logout = (req, res) => {
  res.clearCookie('token'); // remove JWT token cookie
  res.redirect('/users/login'); // redirect to login page
};
const profile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      include: [{ model: Sector, as: 'sectors' }] // ✅ use the correct alias
    });
    console.log(user.sectors); // check if it's loading assigned sectors

    res.render('profile', { user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).send('Server Error');
  }
};

const getAllRegularUsers = async (req, res) => {
  try {
    let whereConditions = { is_deleted: false };

    if (req.user.role === 'admin') {
      // Admins see only users
      whereConditions.role = 'user';
    } else if (req.user.role === 'superadmin') {
       
      whereConditions.role = { [Op.in]: ['user', 'admin'] };
    }

    const users = await User.findAll({
      where: whereConditions,
      attributes: { exclude: ['password'] }
    });

    console.log('Found users:', users.map(u => u.toJSON()));

    res.render('users', { users, user: req.user });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

const editUserPage = async (req, res) => {
  try {
    const id = req.params.id;

    const editUser = await User.findOne({ where: { id } });

    if (!editUser) {
      return res.status(404).send("User not found");
    }

    const sectors = await Sector.findAll();

    // Get sectors assigned to the user if role is admin
    let userSectors = [];
    if (editUser.role === 'admin') {
      const assignedSectors = await editUser.getSectors(); // Assuming many-to-many relation
      userSectors = assignedSectors.map(sector => sector.id);
    }

    res.render('addUser', {
      editUser,
      sectors,
      userSectors,
      user: req.user  // logged-in user, used in layout/partials
    });

  } catch (err) {
    console.error("Error loading user for editing:", err);
    res.status(500).send("Failed to load edit page");
  }
};
const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);

    if (!user) return res.status(404).send("User not found");

    const { name, role } = req.body;

    // Handle image upload
    let imagePath = user.image;
    if (req.file) {
      // Delete old image if exists and not default
      if (user.image && user.image !== '/uploads/default.png') {
        const oldImagePath = path.join(__dirname, '..', 'public', user.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      imagePath = '/uploads/' + req.file.filename;
    }

    // Build update fields dynamically
    const updateFields = {
      name,
      image: imagePath
    };

    if (role) {
      updateFields.role = role;
    }

    // Perform the update
    await user.update(updateFields);

    res.redirect('/users/users');
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).send("Failed to update user");
  }
};
const softDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.is_deleted = true;
    await user.save();

    res.redirect('/users/users'); // or respond with success
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};
const openUpdateProfilePage = async (req, res) => {
  const id = req.user?.id;
  const user = await User.findOne({ where: { id } });

  if (!user) return res.status(404).send("User not found");

  res.render('updateProfile', { user: user.get({ plain: true }) });
}
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` is available (via session or passport)
    const { name, password } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).send('User not found');

    // Update fields
    user.name = name;

    if (password && password.trim() !== '') {
      user.password = password;
    }

    // Handle profile image upload
    if (req.file) {
      if (user.image && user.image !== 'default.png') {
        const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', user.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }

      }
      user.image = '/uploads/' + req.file.filename;
    }

    await user.save();

    res.redirect('/users/profile'); // redirect to updated profile page
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).send('Failed to update profile');
  }
};

module.exports = { updateProfile, openUpdateProfilePage, updateUser, editUserPage, softDeleteUser, getAllRegularUsers, profile, logout, createUser, createPost, loginPage, addUserPage, login };
