const express = require("express");
const router = express.Router();
const { authRequired, adminRequired } = require("../services/auth.js");
const Joi = require("joi");
const { db } = require("../services/db.js");
var fs = require('fs');
const { log } = require("console");
const fsExtra = require("fs-extra")

// GET /messages

router.get("/", function (req, res, next) {
    res.render("messages/index")
});

router.post("/", function (req, res, next) {

    const stmt = db.prepare("SELECT * FROM users WHERE name = ?;")
    const searchResults = stmt.all(req.body.name)

    console.log(req.body.name)
    console.log(searchResults)

    if(searchResults.length == 0){
        res.render("messages/index", { result: { notFound: true } })
    }else{
        res.render("messages/index", { result: { korisnici: searchResults } })
    }
});

router.get("/:id", function (req, res, next) {
    res.render("messages/messaging", {result: {id: req.params.id}})
});

router.post("/:id", function (req, res, next) {
    const stmt = db.prepare("INSERT INTO poruke (poruka, posaljitelj_id, primatelj_id, vrijeme_slanja) VALUES (?, ?, ?, ?);")
    const messageResult = stmt.run(req.body.message, req.params.id, req.body.sentID, new Date().toISOString())

    res.render("messages/messaging")
});

module.exports = router;