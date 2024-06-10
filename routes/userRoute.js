const express = require(`express`);

const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  changeUserPasswordValidator,
  userBlockValidator,
  deleteUserValidator,
} = require("../utils/validators/userValidators/userValidator");
const {
  updateMyDataValidator,
  changeMyPasswordValidator,
  emailVerificationCodeValidator,
  changeMyEmailValidator
} = require("../utils/validators/userValidators/userLoggedInValidator");
const {
  uploadUserImages,
  resizeUserImages,
  getUsers,
  getUser,
  createUser,
  updateUser,
  changeUserPassword,
  userBlock,
  deleteUser,
} = require("../services/userServices/userService");
const {
  emailVerification,
  emailVerificationCode,
  getMyData,
  updateMyData,
  changeMyPassword,
  changeMyEmail
} = require("../services/userServices/userLoggedIn");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router.get(
  "/emailverification",
  protect_allowedTo.protect(true),
  emailVerification
);

router.post(
  "/emailverificationcode",
  protect_allowedTo.protect(true),
  emailVerificationCodeValidator,
  emailVerificationCode
);

router.get(
  "/mydata",
  protect_allowedTo.protect(),
  getMyData,
);

router.put(
  "/updatemydata",
  protect_allowedTo.protect(),
  uploadUserImages,
  updateMyDataValidator,  
  resizeUserImages,
  updateMyData
);

router.put(
  "/changemypassword",
  protect_allowedTo.protect(),
  changeMyPasswordValidator,
  changeMyPassword
);

router.put(
  "/changemyemail",
  protect_allowedTo.protect(true),
  changeMyEmailValidator,
  changeMyEmail
);

/*
  ##################################################
*/

router.use(
  protect_allowedTo.protect(),
  protect_allowedTo.allowedTo("admin"),
);

router
  .route("/")
  .get(
    getUsers
  ).post(
    uploadUserImages,
    createUserValidator,    
    resizeUserImages,
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
    updateUserValidator,    
    resizeUserImages,
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

router.put(
  "/userblock/:id",
  userBlockValidator,
  userBlock,
);

module.exports = router;