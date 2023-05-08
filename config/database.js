const mongoose = require("mongoose");

const dbConection = () => {
  mongoose.connect(process.env.DB_URI).then((conn) => {
    console.log(`database connected ${conn.connection.host}`);
  }).catch((er) => {
    console.log(`database erorr ${er}`);
    process.exit();
  });
};

module.exports = dbConection;