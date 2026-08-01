const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ===============================
// Pending Users
// ===============================
router.get("/pending", async (req, res) => {
  try {
    const pendingUsers = await User.find({
      isApproved: false,
      isRejected: false,
    }).select("-password");

    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching pending users",
    });
  }
});

// ===============================
// All Users
// ===============================
router.get("/", async (req, res) => {
  try {
    const allUsers = await User.find().select("-password");
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

// ===============================
// Approve User
// ===============================
router.put("/approve/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        isRejected: false,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User approved successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error approving user",
    });
  }
});

// ===============================
// Approved Users
// ===============================
router.get("/approved", async (req, res) => {
  try {
    const users = await User.find({
      isApproved: true,
      isRejected: false,
    }).select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// ===============================
// Reject User
// ===============================
router.put("/reject/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: false,
        isRejected: true,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User rejected successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// ===============================
// Rejected Users
// ===============================
router.get("/rejected", async (req, res) => {
  try {
    const users = await User.find({
      isRejected: true,
    }).select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;