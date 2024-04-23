const express = require("express");
const { adminRequired, authRequired } = require("../services/auth");
const router = express.Router();
const fs = require('fs');
const { error } = require("console");

// GET /files
router.get("/", adminRequired, authRequired, function (req, res, next) {
  var dokumenti = fs.readdirSync('datoteke');
  dokumenti.shift()

  res.render("files/index", { result: { items: dokumenti } });
});

// POST /files
router.post("/", function (req, res, next) {
  if (req.files) {
    req.files.file.mv("datoteke/" + req.files.file.name)
  }
  res.redirect("/files");
});

// POST /files/download
router.post("/download", function (req, res, next) {
  if (fs.existsSync(req.body.datoteka)){
    res.download(req.body.datoteka)
  }else{
    res.redirect("/competitions/signups/" + req.body.comp_id)
  }
});

module.exports = router;