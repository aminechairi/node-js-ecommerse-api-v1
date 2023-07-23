const express = require(`express`);

const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
  updateLoggedUserPasswordValidator,
  updateLoggedUserDataValidator,
} = require("../utils/validators/userValidator");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadUserImage,
  resizeImage,
  changeUserPassword,
  getLoggedUserData,
  updateLoggedUserPassword,
  updateLoggedUserData,
} = require("../services/userService");
const 
  authService
  = require("../services/authService");

const routes = express.Router();

routes.get(
  "/getme",
  authService.protect,
  getLoggedUserData,
  getUser
);

routes.put(
  "/updatemypassword",
  authService.protect,
  updateLoggedUserPasswordValidator,
  updateLoggedUserPassword
);

routes.put(
  "/updateme",
  authService.protect,
  updateLoggedUserDataValidator,
  updateLoggedUserData
);


// admin
routes.use(
  authService.protect,
  authService.allowedTo("admin"),
);

routes.put(
  "/changepassword/:id",
  changeUserPasswordValidator,
  changeUserPassword
);

routes
  .route("/")
  .get(
    getUsers
  ).post(
    uploadUserImage,
    resizeImage,
    createUserValidator,
    createUser
  );

routes
  .route("/:id")
  .get(
    getUserValidator,
    getUser
  ).put(
    uploadUserImage,
    resizeImage,
    updateUserValidator,
    updateUser
  )
  .delete(
    deleteUserValidator,
    deleteUser
  );

module.exports = routes;