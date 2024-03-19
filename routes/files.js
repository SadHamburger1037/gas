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
  if(req.files){
    req.files.file.mv("datoteke/"+ req.files.file.name)
  }
  res.redirect("/files");
});

// POST /files/download
router.post("/download", function (req, res, next) {
  res.download("datoteke/"+req.body.datoteka);
});

//link na datoteku radi isto skida, napisati ime datoteke lijevo i staviti link na datoteku koji je gumb i zove se download

module.exports = router;