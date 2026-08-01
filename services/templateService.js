const Template = require("../models/Template");
const ApiError = require("../utils/apiError");

// Create Template
const createTemplate = async (templateData) => {
  if (!templateData.name) {
    throw new ApiError(400, "Template Name is required");
  }

  if (!templateData.type) {
    throw new ApiError(400, "Template Type is required");
  }

  const templateExists = await Template.findOne({
    name: templateData.name,
  });

  if (templateExists) {
    throw new ApiError(409, "Template already exists");
  }

  return await Template.create(templateData);
};

// Get All Templates
const getAllTemplates = async () => {
  const templates = await Template.find().sort({
    createdAt: -1,
  });

  return templates;
};

module.exports = {
  createTemplate,
  getAllTemplates,
};