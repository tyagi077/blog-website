const User = require('../models/User');
const { Sector } = require('../models');
const jwt = require("jsonwebtoken");
const JWT_SECRET = 'your_jwt_secret_key';
const UserSector=require("../models/UserSector")
const createPost= async (req, res) => {
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
    const user = await User.findOne({ where: { email } });

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

    res.redirect('/users/add-user');
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).send('Failed to create user');
  }
};


 const loginPage=async (req,res)=>{
      res.render('login',{user:null})
    };


const addUserPage= async (req, res) => {
  const sectors = await Sector.findAll();
  res.render('addUser', { sectors , user:req.user });
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

module.exports = {profile,logout,createUser,createPost,loginPage,addUserPage,login};
