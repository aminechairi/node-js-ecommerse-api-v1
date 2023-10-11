const express = require(`express`);

const {
  addProductToSavesValidator,
  removeProductFromeSavesValidator
} = require("../utils/validators/saveValidator");

const {
  addProductToSaves,
  removeProductFromeSaves,
  createFilterObj,
  getSaves
} = require("../services/saveService");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router.use(
  protect_allowedTo.protect(),
  protect_allowedTo.allowedTo("user"),
);

router
  .route("/")
  .get(
    createFilterObj,
    getSaves
  )
  .post(
    addProductToSavesValidator,
    addProductToSaves
  );

router
  .route("/:productId")
  .delete(
    removeProductFromeSavesValidator,
    removeProductFromeSaves
  );

module.exports = router;