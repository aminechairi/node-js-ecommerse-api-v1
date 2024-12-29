const mongoose = require("mongoose");

const dbConection = () => {
  mongoose.connect(process.env.DB_URI).then((conn) => {
    console.log(`database connected successfully on ${conn.connection.host}.`);
  });
};

module.exports = dbConection;
