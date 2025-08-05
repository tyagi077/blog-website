const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserSector = sequelize.define('UserSector', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sector_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'user_sectors',
  timestamps: false
});

module.exports = UserSector;
