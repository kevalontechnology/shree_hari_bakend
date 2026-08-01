const mongoose = require("mongoose");

const templateElementSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "text",
        "image",
        "table",
        "line",
        "rectangle",
        "barcode",
        "qrcode"
      ],
    },

    fieldName: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      default: "",
    },

    x: {
      type: Number,
      default: 0,
    },

    y: {
      type: Number,
      default: 0,
    },

    width: {
      type: Number,
      default: 100,
    },

    height: {
      type: Number,
      default: 30,
    },

    fontSize: {
      type: Number,
      default: 14,
    },

    fontWeight: {
      type: String,
      default: "normal",
    },

    color: {
      type: String,
      default: "#000000",
    },

    backgroundColor: {
      type: String,
      default: "transparent",
    },

    textAlign: {
      type: String,
      default: "left",
    },

    border: {
      type: Boolean,
      default: false,
    },

    visible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TemplateElement", templateElementSchema);