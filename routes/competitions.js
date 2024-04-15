const express = require("express");
const router = express.Router();
const { authRequired, adminRequired } = require("../services/auth.js");
const Joi = require("joi");
const { db } = require("../services/db.js");
var fs = require('fs');
const { log } = require("console");
const fsExtra = require("fs-extra")

// GET /competitions
router.get("/", authRequired, function (req, res, next) {
    const stmt = db.prepare(`
        SELECT c.id, c.name, c.description, u.name AS author, c.apply_till
        FROM competitions c, users u
        WHERE c.author_id = u.id
        ORDER BY c.apply_till
    `);
    const result = stmt.all();

    const stmt2 = db.prepare("SELECT * FROM signed_up WHERE user_id = ?");
    const result2 = stmt2.all(req.user.sub);


    // VAZNO provjera jel korisnik prijavljen neda mi se sad

    var natjecanja = result2.map(map => map.competition_id)


    res.render("competitions/index", { result: { items: result, prijave: natjecanja } });
});

// SCHEMA signup
const schema_id = Joi.object({
    id: Joi.number().integer().positive().required()
});

// GET /competitions/delete/:id
router.get("/delete/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt2 = db.prepare("DELETE FROM signed_in WHERE competition_id = ?;")
    const deleteResult2 = stmt.run(req.params.id)

    const stmt = db.prepare("DELETE FROM competitions WHERE id = ?;");
    const deleteResult = stmt.run(req.params.id);

    if (!deleteResult.changes || deleteResult.changes !== 1 || !deleteResult2.changes || deleteResult2.changes !== 1) {
        throw new Error("Operacija nije uspjela");
    }

    res.redirect("/competitions");
});

// GET /competitions/edit/:id
router.get("/edit/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare("SELECT * FROM competitions WHERE id = ?;");
    const selectResult = stmt.get(req.params.id);

    if (!selectResult) {
        throw new Error("Neispravan poziv");
    }

    res.render("competitions/form", { result: { display_form: true, edit: selectResult } });
});

// SCHEMA edit
const schema_edit = Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(1000).required(),
    apply_till: Joi.date().iso().required()
});

// POST /competitions/edit
router.post("/edit", authRequired, function (req, res, next) {
    // do validation
    const result = schema_edit.validate(req.body);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("UPDATE competitions SET name = ?, description = ?, apply_till = ? WHERE id = ?;")
    const updateResult = stmt.run(req.body.name, req.body.description, req.body.apply_till, req.body.id)

    if (updateResult.changes && updateResult.changes === 1) {
        res.redirect("/competitions")
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});


// GET /competitions/add
router.get("/add", adminRequired, function (req, res, next) {
    res.render("competitions/form", { result: { display_form: true } });
});

// SCHEMA add
const schema_add = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(1000).required(),
    apply_till: Joi.date().iso().required()
});

// POST /competitions/add
router.post("/add", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_add.validate(req.body);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("INSERT INTO competitions (name, description, author_id, apply_till) VALUES (?, ?, ?, ?);");
    const insertResult = stmt.run(req.body.name, req.body.description, req.user.sub, req.body.apply_till);

    if (insertResult.changes && insertResult.changes === 1) {
        res.render("competitions/form", { result: { success: true } });
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});

// GET /competitions/singup/:id
router.get("/singup/:id", function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt2 = db.prepare("SELECT * FROM signed_up WHERE user_id = ? AND competition_id = ?");
    const dbResult = stmt2.get(req.user.sub, req.params.id);

    if (dbResult) {
        res.render("competitions/form", { result: { alreadySignedUp: true } });
    }
    else {
        const stmt = db.prepare("INSERT INTO signed_up (user_id, competition_id, applied_at) VALUES (?,?,?);");
        const singUpResult = stmt.run(req.user.sub, req.params.id, new Date().toISOString())

        if (singUpResult.changes && singUpResult.changes === 1) {
            res.render("competitions/form", { result: { signedUp: true } });
        } else {
            res.render("competitions/form", { result: { database_error: true } });
        }
    }
});

// GET /competitions/singups/:id
router.get("/signups/:id", function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare("SELECT * FROM signed_up WHERE competition_id = ? ORDER BY applied_at");
    const podatci = stmt.all(req.params.id);

    const stmt2 = db.prepare("SELECT id FROM users");
    const podatci2 = stmt2.all();

    podatci22 = podatci2.map(map => map.id)

    var dokumenti = [];

    for (let i = 1; i <= podatci22.length; i++) {
        if (dokumenti.length == 0) {
            dokumenti.push("")
        }

        if (fs.existsSync(`datoteke/${i}/${req.params.id}`)) {
            dokumenti.push(fs.readdirSync(`datoteke/${i}/${req.params.id}`).toString());
        }
        else {
            dokumenti.push("")
        }
    }

    console.log(dokumenti)

    if (podatci) {
        res.render("competitions/signups", { result: { items: podatci, dokumenti: dokumenti } });
    } else {
        res.render("competitions/signups", { result: { database_error: true } });
    }

});

// POST /competitions/editpoints/:id
router.post("/editpoints/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare("UPDATE signed_up SET bodovi = ? WHERE id = ?;");
    const selectResult = stmt.run(req.body.bodovi, req.params.id);

    if (!selectResult) {
        throw new Error("Neispravan poziv");
    }

    res.redirect("/competitions/signups/" + req.body.competition_id);
});

//GET /competitions/results

router.get("/results/:id", function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare(`
        SELECT c.apply_till, c.name AS natjecanje, su.bodovi, u.name
        FROM signed_up su
        JOIN competitions c ON su.competition_id = c.id
        JOIN users u ON su.user_id = u.id
        WHERE su.competition_id = ?
        ORDER BY su.bodovi DESC
    `);
    const resultDB = stmt.all(req.params.id);

    res.render("competitions/results", { result: { items: resultDB, noMenu: true } });
})

//GET /competitions/sendresults

router.get("/sendresults/:id", function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt2 = db.prepare("SELECT * FROM signed_up WHERE user_id = ? AND competition_id = ?");
    const dbResult = stmt2.get(req.user.sub, req.params.id);

    if (!dbResult) {
        res.render("competitions/sendresults", { result: { alreadySignedUp: true } });
    } else {
        res.render("competitions/sendresults", { result: { id: req.params.id } });
    }



})

//POST /competitions/sendresults

router.post("/sendresults/:id", function (req, res, next) {

    if (!fs.existsSync("datoteke/" + req.user.sub + "/" + req.params.id)) {
        fs.mkdirSync("datoteke/" + req.user.sub + "/" + req.params.id);
    }


    if (req.files) {
        fsExtra.emptyDirSync("datoteke/" + req.user.sub + "/" + req.params.id)
        req.files.file.mv("datoteke/" + req.user.sub + "/" + req.params.id + "/" + req.files.file.name)
    }
    res.redirect("/competitions/sendresults/" + req.params.id);
});

module.exports = router;