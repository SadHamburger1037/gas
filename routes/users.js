const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { db } = require("../services/db.js");
const { getUserToken, authRequired, checkEmailUnique } = require("../services/auth.js")
const { checkAuthCookie } = require("../services/auth.js")
const bcrypt = require("bcrypt")

// GET /users/signout

router.get("/signout", authRequired, function (req, res, next) {
  res.clearCookie(process.env.AUTH_COOKIE_KEY)
  res.redirect("/")
});

//GET /users/data

router.get("/data", authRequired, function (req, res, next) {
  res.render("users/data", { result: { display_form: true } })
});

// GET /users/signin
router.get("/signin", function (req, res, next) {
  res.render("users/signin", { result: { display_form: true } });
});

// SCHEMA signin
const schema_signin = Joi.object({
  email: Joi.string().email().max(50).required(),
  password: Joi.string().min(3).max(50).required()
});

const schema_data = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().max(50).required(),
  password: Joi.string().min(3).max(50).allow(null, "")
});

//POST /users/data
router.post("/data", authRequired, function (req, res, next) {
  // do validation
  const result = schema_data.validate(req.body);
  if (result.error) {
    res.render("users/data", { result: { validation_error: true, display_form: true } });
    return;
  }

  const newName = req.body.name
  const newEmail = req.body.email
  const newPassword = req.body.password
  const currentUser = req.user

  let emailChanged = false
  if (newEmail !== currentUser.email) {
    if (!checkEmailUnique(newEmail)) {
      res.render("users/data", { result: { email_not_unique: true, display_form: true } });
      return;
    }
    emailChanged = true
  }

  let nameChanged = false
  if (newName !==currentUser.name){
    nameChanged = true
  }

  let passwordChanged = false;
  let passwordHash
  if (newPassword && newPassword.length > 0) {
    passwordHash = bcrypt.hashSync(newPassword, 10)
    passwordChanged = true
  }

  if (!emailChanged && !nameChanged && !passwordChanged){
    res.render("users/data", { result: { display_form: true } });
  }

  let query = "UPDATE users SET"
  if (emailChanged) query += " email = ?,"
  if (nameChanged) query += " name = ?,"
  if (passwordChanged) query += " password = ?,"


});

// POST /users/signin
router.post("/signin", function (req, res, next) {
  // do validation
  const result = schema_signin.validate(req.body);
  if (result.error) {
    res.render("users/signin", { result: { validation_error: true, display_form: true } });
    return;
  }

  const email = req.body.email;
  const password = req.body.password

  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  const dbResult = stmt.get(email);

  if (dbResult) {
    const passwordHash = dbResult.password
    const compareResult = bcrypt.compareSync(password, passwordHash)

    if (!compareResult) {
      res.render("users/signin", { result: { invalid_credentials: true } });
      return
    }

    const token = getUserToken(dbResult.id, dbResult.email, dbResult.name, dbResult.role)

    res.cookie(process.env.AUTH_COOKIE_KEY, token)

    res.render("users/signin", { result: { success: true } });
  } else {

    res.render("users/signin", { result: { invalid_credentials: true } });
  }


});

// GET /users/signup
router.get("/signup", function (req, res, next) {
  res.render("users/signup", { result: { display_form: true } });
});

// SCHEMA signup
const schema_signup = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().max(50).required(),
  password: Joi.string().min(3).max(50).required(),
  password_check: Joi.ref("password")
});

// POST /users/signup
router.post("/signup", function (req, res, next) {
  // do validation
  const result = schema_signup.validate(req.body);
  if (result.error) {
    res.render("users/signup", { result: { validation_error: true, display_form: true } });
    return;
  }

  if (!checkEmailUnique(req.body.email)) {
    res.render("users/signup", { result: { email_not_unique: true, display_form: true } });
    return;
  }

  const passwordHash = bcrypt.hashSync(req.body.password, 10)

  const stmt = db.prepare("INSERT INTO users (name, email, password, signed_at, role) VALUES (?,?,?,?,?);")
  const insertResult = stmt.run(req.body.name, req.body.email, passwordHash, Date.now(), "user")

  if (insertResult.changes && insertResult.changes === 1) {
    res.render("users/signup", { result: { success: true } });
  } else {
    res.render("users/signup", { result: { database_error: true } });
  }

});

module.exports = router;
