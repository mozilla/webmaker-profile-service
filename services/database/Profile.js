module.exports = function Profile(sequelize, DataTypes) {
  return sequelize.define("Profile", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userid: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true }
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci'
  });
};
