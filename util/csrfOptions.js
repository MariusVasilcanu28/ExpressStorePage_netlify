const { CSRF_CSRF_SECRET } = require("./keys");

// CSRF_CSRF_SECRET is just a string with random symbols, you can use any string you want
module.exports = {
  options: {
    getSecret: () => CSRF_CSRF_SECRET,
    cookieName: "csrf", // This should match the name of the cookie set by the CSRF middleware
    cookieOptions: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    },
    getTokenFromRequest: (req) => {
      // Extract CSRF token from the body or the headers
      if (req.body && req.body.csrfToken) {
        return req.body.csrfToken;
      }
      return req.headers["x-csrf-token"]; // For AJAX requests, if applicable
    },
  },
};
