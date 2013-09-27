var Sequelize = require("sequelize");

module.exports.createClient = function createClient(url) {
  var options = {},
      sequelize;

  // If you're using sqlite, we need to set the storage location manually
  if (url.indexOf("sqlite://") === 0) {
    options.storage = "profile.sqlite";
  }

  sequelize = new Sequelize(url, options);

  var Profile = sequelize.import(__dirname + "/Profile");
  Profile.sync().error(function(err) {
    console.error("Failed to synchronize sequelize with database '%s', shutting down.", url);
    console.error(err);
    process.exit(1);
  });

  return Profile;
};
