const Sequelize = require('sequelize');

const sequelize = new Sequelize('niddhiexpensetracker', 'root', 'Somya@1901b', {
  host: 'localhost',
  dialect: 'mysql', 
});

module.exports = sequelize;
