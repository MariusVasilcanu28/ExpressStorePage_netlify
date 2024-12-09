const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { check, body } = require("express-validator");
const User = require("../models/user");

// /login => GET
router.get("/login", authController.getLogin);

// /login => POST
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail({ gmail_remove_dots: false }),
    body("password", "Password has to be valid.")
      .isLength({ min: 4 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

// /logout => POST
router.post("/logout", authController.postLogout);

// /signup => GET
router.get("/signup", authController.getSignup);

// /signup => POST
router.post(
  "/signup",
  [
    check("email", "Please enter a valid email")
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-Mail exists already, please pick a different one"
            );
          }
        });
      })
      .normalizeEmail({ gmail_remove_dots: false }),

    body(
      "password",
      "Please enter an alphanumeric password with at least 4 characters"
    )
      .isLength({ min: 4 })
      .isAlphanumeric()
      .trim(),

    body("confirmPassword")
      .custom((value, { req }) => {
        if (!value) {
          throw new Error("Please confirm your password");
        }

        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      })
      .trim(),
  ],
  authController.postSignup
);

// /reset => GET
router.get("/reset", authController.getReset);

// /reset => POST
router.post("/reset", authController.postReset);

// /new-password => GET
router.get("/reset/:token", authController.getNewPassword);

// /new-password => POST
router.post("/new-password", authController.postNewPassword);

module.exports = router;
