const express = require(`express`);

const {
  addUserAddressValidator,
  removeUserAddressValidator
} = require("../utils/validators/addressValidator");

const {
  addUserAddress,
  removeUserAddress,
  getUserAddresses
} = require("../services/addressService");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router.use(
  protect_allowedTo.protect(),
  protect_allowedTo.allowedTo("user", "manager", "admin"),
);

router
  .route("/")
  .get(
    getUserAddresses
  )
  .post(
    addUserAddressValidator,
    addUserAddress
  );

router
  .route("/:addressId")
  .delete(
    removeUserAddressValidator,
    removeUserAddress,
  );

module.exports = router;
