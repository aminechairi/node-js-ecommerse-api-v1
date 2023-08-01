const express = require(`express`);

const authService = require("../services/authService");
const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  
  changeUserPasswordValidator,
} = require("../utils/validators/userValidator");

const {
  uploadUserImages,
  resizeUserImages,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,

  changeUserPassword,
} = require("../services/userService");

const router = express.Router();

router.use(
  authService.protect,
  authService.allowedTo("admin"),
);

router
  .route("/")
  .get(
    getUsers
  ).post(
    uploadUserImages,
    resizeUserImages,
    createUserValidator,
    createUser
  );

router
  .route("/:id")
  .get(
    getUserValidator,
    getUser
  )
  .put(
    uploadUserImages,
    resizeUserImages,
    updateUserValidator,
    updateUser
  )
  .delete(
    deleteUserValidator,
    deleteUser
  );

router.put(
  "/changepassword/:id",
  changeUserPasswordValidator,
  changeUserPassword
);

module.exports = router;