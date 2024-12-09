const crypto = require("crypto");
const argon2 = require("argon2");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const { check, validationResult } = require("express-validator");

const transporter = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: "api",
    pass: "58d7023e7d0742699b25fd5e5abfc49f",
  },
});

// Reusable function to handle setting and clearing flash cookies
const setFlashMessage = (res, type, message, duration = 1000) => {
  res.cookie(type, message, { maxAge: duration });
};

// GET Login - Reads from cookie
exports.getLogin = (req, res, next) => {
  const errorMessage = req.cookies.error || null;
  res.clearCookie("error"); // Clear after reading the message

  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: errorMessage,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

// POST Login
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or passsword",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      }

      argon2
        .verify(user.password, password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          } else {
            return res.status(422).render("auth/login", {
              path: "/login",
              pageTitle: "Login",
              errorMessage: "Invalid email or passsword",
              oldInput: {
                email: email,
                password: password,
              },
              validationErrors: [],
            });
          }
        })
        .catch((err) => {
          console.log(err);
          return res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// POST Logout
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/login");
  });
};

// GET Signup - Reads from cookie
exports.getSignup = (req, res, next) => {
  const errorMessage = req.cookies.error || null;
  res.clearCookie("error"); // Clear after reading the message

  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: errorMessage,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

// POST Signup - Uses cookie for messages
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  argon2
    .hash(password, { hashLength: 12 })
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      const mailOptions = {
        from: "stage@vmd-dev.com",
        to: email,
        subject: "Signup Succeeded!",
        html: `<p>You successfully signed up! - ${email}</p>`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(`Error:`, error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// GET Reset - Reads from cookie
exports.getReset = (req, res, next) => {
  const errorMessage = req.cookies.error || null;
  res.clearCookie("error");

  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: errorMessage,
  });
};

// POST Reset - Uses cookie for messages
exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }

    const token = buffer.toString("hex");

    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          setFlashMessage(
            res,
            "error",
            `No account with ${req.body.email} email found`
          );
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour expiration
        return user.save();
      })
      .then((result) => {
        const mailOptions = {
          from: "stage@vmd-dev.com",
          to: req.body.email,
          subject: "Password reset",
          html: `<p>You requested a password reset</p><p>Click <a href="http://localhost:3000/reset/${token}">this link</a> to set a new password</p>`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(`Error:`, error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
        res.redirect("/");
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

// GET New Password - Reads from cookie
exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      const errorMessage = req.cookies.error || null;
      res.clearCookie("error");

      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "Reset Password",
        errorMessage: errorMessage,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// POST New Password
exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return argon2.hash(newPassword, { hashLength: 12 });
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
