const { Op } = require('sequelize');

const { Blog, Sector, User } = require('../models');

const UserSector = require('../models/UserSector');

const getBlog = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let blogs;

    if (userRole === 'admin') {
      const userSectors = await UserSector.findAll({
        where: { user_id: userId },
        attributes: ['sector_id']
      });

      const sectorIds = userSectors.map(us => us.sector_id);

      // Get approved blogs in those sectors
      blogs = await Blog.findAll({
        where: {
          sector_id: sectorIds,
          approved_by: { [Op.ne]: null } // approved
        },
        include: [
          { model: Sector },
          { model: User, attributes: ['id', 'name'] }
        ]
      });

    } else {
      // For normal user: only their own approved blogs or public approved blogs
      blogs = await Blog.findAll({
        where: {
          approved_by: { [Op.ne]: null },
          [Op.or]: [
            { user_id: userId },
            { scope: 'public' }
          ]
        },
        include: [
          { model: Sector },
          { model: User, attributes: ['id', 'name'] }
        ]
      });
    }

    res.status(200).json({ blogs });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blogs', details: err.message });
  }
};


const getPendingBlogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole == 'user'  ) {
      return res.status(403).json({ error: 'Access denied. Only admins can view pending blogs.' });
    }

    // Get sectors assigned to this admin
    const userSectors = await UserSector.findAll({
      where: { user_id: userId },
      attributes: ['sector_id']
    });

    // doing this to convert objects of array to array (coz findall return objects of array)
    const sectorIds = userSectors.map(us => us.sector_id);

    // Get unapproved blogs in those sectors
    const pendingBlogs = await Blog.findAll({
      where: {
        sector_id: sectorIds,
        approved_by: null
      },
      include: [
        { model: Sector },
        { model: User, attributes: ['id', 'name'] }
      ]
    });


    res.status(200).json({ pendingBlogs });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending blogs', details: err.message });
  }
};

const getPendingBlogsPage = async (req, res) => {
  try {

    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (adminRole === 'user') {
      return res.status(403).send('Access denied');
    }

    let whereCondition = {
      approved_by: null,
      scope: 'public'
    };

    if (adminRole !== 'superadmin') {
      // Get sectors assigned to admin
      const assignedSectors = await UserSector.findAll({
        where: { user_id: adminId },
        attributes: ['sector_id']
      });
      const sectorIds = assignedSectors.map(s => s.sector_id);

      whereCondition.sector_id = sectorIds.length > 0 ? { [Op.in]: sectorIds } : null;
      // If no sectors assigned, sector_id will be null → no blogs
    }
    // If superadmin, no sector filter → sees all pending blogs

    const blogs = await Blog.findAll({
      where: whereCondition,
      include: [
        { model: Sector },
        { model: User, attributes: ['name'] }
      ]
    });

    console.log("Pending Blogs:", blogs);

    res.render('approvedBlogs', { blogs, user: req.user });

  } catch (err) {
    console.error("Error fetching pending blogs:", err);
    res.status(500).send("Internal Server Error");
  }
};

const approveBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (adminRole == 'user') {
      return res.status(403).send('Only admins can approve blogs');
    }

    // Get blog and check if admin is allowed to approve it
    const blog = await Blog.findByPk(blogId);
    const allowedSectors = await UserSector.findAll({
      where: { user_id: adminId },
      attributes: ['sector_id']
    });
    const sectorIds = allowedSectors.map(s => s.sector_id);

    if (!blog || !sectorIds.includes(blog.sector_id)) {
      return res.status(403).send('You cannot approve this blog');
    }

    blog.approved_by = adminId;
    blog.is_approved=true;
    await blog.save();

    res.redirect('/blogs/approved-blogs');
  } catch (err) {
    console.error('Approval Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

const editBlogsPage = async (req, res) => {
  try {
    const id = req.params.id;

    // Get the blog to edit
    const blog = await Blog.findOne({ where: { id }, include: [Sector] });

    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // Get all sectors (for the dropdown)
    const sectors = await Sector.findAll();

    // Render the blog form with blog pre-filled
    res.render('createBlog', {
      blog,
      sectors,
      user: req.user
    });

  } catch (err) {
    console.error("Error loading blog for editing:", err);
    res.status(500).send("Failed to load edit page");
  }
};



const createBlog = async (req, res) => {
  try {
    const image = req.file?.filename; // from multer
    const { title, description, sector_id, scope } = req.body;

    const user_id = req.user?.id; // assuming req.user is set by JWT middleware
    const updated_by = req.user?.id;

    if (!user_id) {
      return res.status(400).json({ error: 'User not authenticated' });
    }

   const userSectors = await UserSector.findAll({
    where:{
      user_id
    },
    attributes:['sector_id'],
    raw:true
   })

   const userSectorIds = userSectors.map(us=>us.sector_id);

   const isApproved=userSectorIds.includes(Number(sector_id));
   const approved_by=isApproved? user_id:null;


    

    const blog = await Blog.create({
      title,
      description,
      image: `/uploads/${image}`,
      sector_id,
      user_id,
      scope,
      updated_by,
      is_approved:isApproved,
      approved_by
    });

    

    res.redirect('/blogs/allBlogs');
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};


// Route to render the blog creation form
const getblogPage = async (req, res) => {
  try {
    const sectors = await Sector.findAll(); // fetch sectors to populate the dropdown
    res.render('createBlog', { blog: null, sectors, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load blog form");
  }
};

const getAddSectorPage = (req, res) => {
  res.render('addSector', { user: req.user }); // Add user if needed
};

const addSector = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if sector already exists
    const existing = await Sector.findOne({ where: { name } });
    if (existing) {
      return res.status(400).send('Sector already exists');
    }

    // Create new sector
    const newSector = await Sector.create({ name });

    // If logged-in user is superadmin, assign this sector to them
    if (req.user.role === 'superadmin') {
      await UserSector.create({
        user_id: req.user.id,
        sector_id: newSector.id
      });
    }

    res.redirect('/blogs/allBlogs'); // or redirect as needed

  } catch (error) {
    console.error('Error adding sector:', error);
    res.status(500).send('Internal Server Error');
  }
};

const myBlogsPage = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user is available from middleware

    const blogs = await Blog.findAll({
      where: { user_id: userId },
      include: [{ model: Sector }]
    });

    res.render('myBlogs', { blogs, user: req.user });
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).send('Internal Server Error');
  }
};


const getApprovedBlogsPage = async (req, res) => {
  try {
    const loggedInUserId = req.user?.id;

    if (!loggedInUserId) {
      return res.status(401).send("Unauthorized");
    }

    const blogs = await Blog.findAll({
      where: {
        user_id: loggedInUserId,
        approved_by: { [Op.ne]: null }
      },
      
      include: [
        { model: Sector },
        { model: User, as: 'Approver', attributes: ['name'] },  // Approver info
        { model: User, attributes: ['name'], required: false }  // Author info
      ]
    });

    res.render('approvedBlogs', { blogs, user: req.user || null });
  } catch (err) {
    console.error('Error fetching approved blogs:', err);
    res.status(500).send('Internal Server Error');
  }
};


const getAllPublicApprovedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      where: {
        scope: 'public',
        approved_by: { [Op.ne]: null }
      },
      include: [
        {
          model: Sector,
          attributes: ['id', 'name']
        },
        {
          model: User,
          attributes: ['id', 'name']
        }
      ]
    });

    res.render('blogs', { blogs, user: req.user });
  } catch (err) {
    console.error('❌ Error in GET /:', err);
    res.status(500).send('Error loading homepage');
  }
};


const getBlogDetails = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      where: { id: req.params.id },
      include: [
        { model: Sector },
        { model: User, attributes: ['name'] }
      ]
    });

    if (!blog) {
      return res.status(404).send('Blog not found');
    }

    res.render('blogDetails', { blog, user: req.user || null });
  } catch (err) {
    console.error('Error fetching blog details:', err);
    res.status(500).send('Internal Server Error');
  }
};

const updateBlog = async (req, res) => {
  try {
    console.log(req.body);
    const blogId = req.params.id;
    const { title, content, scope, sector_id } = req.body;

    const updated = await Blog.update(
      { title, content, scope, sector_id },
      { where: { id: blogId } }
    );

    if (updated[0] === 0) {
      return res.status(404).json({ message: 'Blog not found or no changes made' });
    }

    res.redirect('/blogs/my-blogs'); // or wherever you want to redirect
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update blog', error: error.message });
  }
};

module.exports = { updateBlog, editBlogsPage, getBlogDetails, getPendingBlogsPage, approveBlog, getAllPublicApprovedBlogs, createBlog, getBlog, getPendingBlogs, getblogPage, getAddSectorPage, addSector, myBlogsPage, getApprovedBlogsPage }