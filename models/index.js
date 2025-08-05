const Blog = require('./Blog');
const Sector = require('./Sector');
const User = require('./User');
const UserSector = require('./UserSector')
// Set associations
Blog.belongsTo(Sector, { foreignKey: 'sector_id', as: 'Sector' });
Sector.hasMany(Blog, { foreignKey: 'sector_id', as: 'Blogs' });

Blog.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(Blog, { foreignKey: 'user_id', as: 'Blogs' });
Blog.belongsTo(User, { foreignKey: 'approved_by', as: 'Approver' });

User.belongsToMany(Sector, {
  through: UserSector,
  foreignKey: 'user_id',
  otherKey: 'sector_id',
  as: 'sectors'
});

Sector.belongsToMany(User, {
  through: UserSector,
  foreignKey: 'sector_id',
  otherKey: 'user_id',
  as: 'users'
});
module.exports = { Blog, Sector, User,UserSector };
