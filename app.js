// Imports
const https = require("https");
const serverless = require("serverless-http");
const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const { doubleCsrf } = require("csrf-csrf");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Controllers
const errorController = require("./controllers/error");

// Models
const User = require("./models/user");

// Routes
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

// Config/Constants
const { MONGODB_URI, CSRF_CSRF_SECRET, PORT } = require("./util/keys");
const { options } = require("./util/csrfOptions");

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/multedImg");
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const { doubleCsrfProtection } = doubleCsrf(options);

// Application Setup
app.set("view engine", "ejs");
app.set("views", "views");

// Middleware
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "js.stripe.com"],
      "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      "frame-src": ["'self'", "js.stripe.com"],
      "font-src": ["'self'", "fonts.googleapis.com", "fonts.gstatic.com"],
    },
  })
);
app.use(compression());
app.use(
  morgan("combined", {
    stream: fs.createWriteStream(path.join(__dirname, "access.log"), {
      flags: "a",
    }),
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/public/multedImg",
  express.static(path.join(__dirname, "public/multedImg"))
);
app.use(
  session({
    name: "UserSession",
    secret: "mysecret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(cookieParser(CSRF_CSRF_SECRET));
app.use(doubleCsrfProtection);

// Set Local Variables
app.use((req, res, next) => {
  res.locals.isAuth = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken(); // Generate CSRF token
  next();
});

// User Session Handling
app.use((req, res, next) => {
  if (!req.session.user) return next();

  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) return next();
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

// Routes
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// Error Handling
app.use((req, res, next) => {
  if (req.cookies.error) {
    res.locals.errorMessage = req.cookies.error;
    res.clearCookie("error");
  }
  next();
});

app.use("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuth: req.session.isLoggedIn,
  });
});

// Database Connection and Server Start
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error(err));

// Export the app
module.exports = app;
