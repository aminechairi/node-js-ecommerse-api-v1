const app = require("./app");

const PORT = process.env.PORT || 5000;

// Start the server
const server = app.listen(PORT, (_) => {
  console.log(`App runnig on port ${PORT}`);
});

// handle rejection outside express
process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection Erorr: ${err.name} | ${err.message}`);

  server.close(() => {
    console.log("Shutting down...");
    process.exit(1);
  });
});
