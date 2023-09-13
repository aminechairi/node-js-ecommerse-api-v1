const express = require(`express`);

const {
  addAddressToAddresseslistValidator,
  removeAddressFromAddresseslistValidator
} = require("../utils/validators/addressValidator");

const {
  addAddressToAddresseslist,
  removeAddressFromAddresseslist,
  getLoggedUserAddressesList
} = require("../services/addressService");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router.use(
  protect_allowedTo.protect(),
  protect_allowedTo.allowedTo("user"),
);

router
  .route("/")
  .get(
    getLoggedUserAddressesList
  )
  .post(
    addAddressToAddresseslistValidator,
    addAddressToAddresseslist
  );

router
  .route("/:addressId")
  .delete(
    removeAddressFromAddresseslistValidator,
    removeAddressFromAddresseslist,
  );

module.exports = router;