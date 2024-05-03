const User = require("../models/user.model");

const { sendVerificationEmail } = require("../config/sendgrid.service");

const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

require("dotenv").config();

const signup = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    return res.status(409).json({
      status: "conflict",
      code: 409,
      ResponseBody: {
        message: "Email in use",
      },
    });
  }

  try {
    const avatarURL = gravatar.url(email, { s: "200", r: "pg", d: "mm" });

    const newUser = new User({ email, avatarURL });

    const verificationToken = uuid.v4();

    newUser.setPassword(password);

    newUser.verify = false;
    newUser.verificationToken = verificationToken;

    await newUser.save();

    await sendVerificationEmail(email, newUser.verificationToken);
    return res.status(201).json({
      status: "created",
      code: 201,
      ResponseBody: {
        user: {
          email: email,
          subscription: "starter",
          avatarURL: avatarURL,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.validPassword(password)) {
    return res.status(401).json({
      status: "unauthorized",
      code: 401,
      ResponseBody: {
        message: "Email or password is wrong",
      },
    });
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "1h" });
  user.token = token;
  await user.save();
  res
    .status(200)
    .header("Content-Type", "application/json")
    .json({
      status: "created",
      code: 201,
      ResponseBody: {
        token,
        user: {
          email,
          subscription: "starter",
        },
      },
    });
};

const logout = async (req, res, next) => {
  const id = req.user._id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(401)
        .header("Content-Type", "application/json")
        .json({
          status: "Unauthorized",
          code: 401,
          ResponseBody: {
            message: "Not authorized",
          },
        });
    }

    user.token = null;
    await user.save();

    res.status(204).json({
      status: "no content",
      code: 204,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrent = async (req, res, next) => {
  const { _id, email } = req.user;
  try {
    const user = await User.findById(_id);
    if (!user) {
      return res
        .status(401)
        .header("Content-Type", "application/json")
        .json({
          status: "Unauthorized",
          code: 401,
          ResponseBody: {
            message: "Not authorized",
          },
        });
    }
    res
      .status(200)
      .header("Content-Type", "application/json")
      .json({
        status: "OK",
        code: 200,
        ResponseBody: {
          email: email,
          subscription: "starter",
        },
      });
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        status: "Unauthorized",
        code: 401,
        ResponseBody: {
          message: "Not authorized",
        },
      });
    }

    const storage = multer.diskStorage({
      destination: "./tmp/",
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
      },
    });

    const upload = multer({ storage: storage }).single("avatar");

    upload(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      const tmpPath = req.file.path;
      const image = await jimp.read(tmpPath);
      await image.resize(250, 250).write(tmpPath);

      const avatarFileName = `avatar-${req.user._id}${path.extname(
        req.file.originalname
      )}`;
      const avatarDestination = path.join(
        __dirname,
        "../public/avatars",
        avatarFileName
      );
      fs.renameSync(tmpPath, avatarDestination);

      const avatarURL = `/avatars/${avatarFileName}`;
      user.avatarURL = avatarURL;
      await user.save();

      res.status(200).json({
        avatarURL,
      });
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;

  console.log(`Verification token received: ${verificationToken}`);

  try {
    const user = await User.findOne({ verificationToken });

    if (!user) {
      console.log("User not found with the provided token.");
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User found:", user);

    user.verificationToken = null;
    user.verify = true;
    await user.save();

    console.log("User updated successfully.");
    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    console.error("Error during verification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const resendVerificationEmail = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "missing required field email",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.verify) {
      return res.status(400).json({
        message: "Verification has already been passed",
      });
    }

    await sendVerificationEmail(email, user.verificationToken);

    res.status(200).json({
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrent,
  updateAvatar,
  verifyEmail,
  resendVerificationEmail,
};
