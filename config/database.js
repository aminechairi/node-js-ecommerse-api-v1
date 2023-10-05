const mongoose = require("mongoose");

const dbConection = () => {
  mongoose.connect("mongodb+srv://admin:admin2000@cluster0.isseznv.mongodb.net/udemy-ecommerse?retryWrites=true&w=majority").then((conn) => {
    console.log(`database connected ${conn.connection.host}`);
  })
};

module.exports = dbConection;