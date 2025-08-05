const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Sector = sequelize.define('Sector', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'sector', // ✅ match your manual table name
  timestamps: false
});

module.exports = Sector;
