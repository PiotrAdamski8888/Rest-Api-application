const passport = require("passport");
const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      code: 401,
      message: "Unauthorized",
      data: "Unauthorized",
    });
  }

  const tokenValue = token.split(" ")[1];

  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (!user || err || tokenValue !== user.token) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized",
        data: "Unauthorized",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = auth;
