
const express = require("express");
const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phoneNumber, role, branch, password } = req.body;

    const userExists = await User.findOne({
      $or: [
        { email },
        { phoneNumber }
      ]
    });

    if (userExists) {
      return res.status(400).json({
        message: "User with this email or phone already exists"
      });
    }

    const isApproved = role === "Admin";

    const user = await User.create({
      name,
      email,
      phoneNumber,
      role,
      branch,
      password,
      isApproved,
    });

    try {
      await Notification.create({
        title: 'New User Registration',
        message: `${name} has registered as a ${role} and is ${isApproved ? 'approved' : 'awaiting approval'}.`,
        type: 'user'
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id),
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
});

// Login
router.post("/login", async (req, res) => {
  try {

    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phoneNumber: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    if (!user.isApproved) {
      return res.status(401).json({
        message: "Account pending Admin approval."
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
});

module.exports = router;