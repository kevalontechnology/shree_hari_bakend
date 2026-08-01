const express = require("express");

const router = express.Router();

const {
  createTemplate,
  getAllTemplates,
} = require("../controllers/templateController");

router.post("/", createTemplate);

router.get("/", getAllTemplates);

module.exports = router;