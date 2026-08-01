const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    pageSize: {
      type: String,
      default: "A4",
    },

    orientation: {
      type: String,
      enum: ["portrait", "landscape"],
      default: "portrait",
    },

    backgroundColor: {
      type: String,
      default: "#ffffff",
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Template", templateSchema);