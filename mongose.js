const mongoose = require('mongoose');


module.exports.connect = (dbURL) => {
    return mongoose.connect(dbURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  };

