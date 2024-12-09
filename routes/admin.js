const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const { body } = require("express-validator");

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/product => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  [
    body("title", "Please enter a title")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price", "Please enter a valid price").isFloat(),
    body(
      "description",
      "Please use a minimum of 5 and maximum of 400 characters"
    )
      .isLength({ min: 5, max: 400 })
      .trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

// // /admin/edit-product => GET
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

// // // /admin/edit-product => POST
router.post(
  "/edit-product",
  [
    body("title", "Please enter a title")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price", "Please enter a valid price").isFloat(),
    body(
      "description",
      "Please use a minimum of 5 and maximum of 400 characters"
    )
      .isLength({ min: 5, max: 400 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

// // // /admin/delete-product => POST
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
