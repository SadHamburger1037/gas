const express = require("express");
const router = express.Router();
const {authRequired} = require("../services/auth.js")

// GET /
router.get("/", function(req, res, next) {
  res.render("competitions/index");
});

module.exports = router