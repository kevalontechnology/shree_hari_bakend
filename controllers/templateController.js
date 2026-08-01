const Template = require("../models/Template");
const ApiError = require("../utils/apiError");

// Create Template
const createTemplate = async (req, res, next) => {
  try {
    const templateData = req.body;

    if (!templateData.name) {
      return next(new ApiError(400, "Template Name is required"));
    }

    if (!templateData.type) {
      return next(new ApiError(400, "Template Type is required"));
    }

    const templateExists = await Template.findOne({
      name: templateData.name,
    });

    if (templateExists) {
      return next(new ApiError(409, "Template already exists"));
    }

    const newTemplate = await Template.create(templateData);
    return res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: newTemplate,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Templates
const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTemplate,
  getAllTemplates,
};