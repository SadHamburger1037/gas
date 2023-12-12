var express = require('express');
var router = express.Router();
var Joi = require('joi');
var fs = require('fs');

router.get('/signin', function (req, res, next) {
  res.render('users/signin', { status: { display_form: true, error: false } });
});

const schema_signin = Joi.object({
  email: Joi.string().email().max(50).required(),
  password: Joi.string().required().max(50)
});

router.post('/signin', async function (req, res, next) {

  const data = req.body

  const validation = schema_signin.validate(data);

  if (validation.error) {
    res.render('users/signin', { status: { submit_form: true, error: true } });
  } else {
    // TODO: prijava korisnika
    fs.writeFileSync('data.JSON', JSON.stringify(data))
    res.render('users/signin', { status: { submit_form: true, error: false } });

    /*await new Promise(resolve => {
      setTimeout(resolve, 5000);
    });
    res.redirect('test');*/
  }
});

router.get('/register', function (req, res, next) {
  res.render('users/register', { status: { display_form: true, error: false } });
});

router.post('/register', async function (req, res, next) {

  const data = req.body

  const validation = schema_signin.validate(data);

  if (validation.error) {
    res.render('users/register', { status: { submit_form: true, error: true } });
  } else {
    // TODO: prijava korisnika
    fs.writeFileSync('data.JSON', JSON.stringify(data))
    res.render('users/register', { status: { submit_form: true, error: false } });

    /*await new Promise(resolve => {
      setTimeout(resolve, 5000);
    });
    res.redirect('test');*/
  }
});

module.exports = router;
