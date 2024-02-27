const express = require("express");
const { adminRequired, authRequired } = require("../services/auth");
const router = express.Router();

// GET /files
router.get("/", adminRequired, authRequired, function (req, res, next) {
  res.render("files/index");
});

// POST /files
router.post("/", function (req, res, next) {

    console.log(req.files.file)

    req.files.file.mv("datoteke/"+ req.files.file.name)
    
    res.render("files/index");
});

module.exports = router;