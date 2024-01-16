const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

const { resolveMx } = require("dns")
const jwt = require("jsonwebtoken")

function getUserToken(id, email, name, role, expDays = 7) {

    const tokenData = {
        uid: id,
        email: email,
        name: name,
        role: role,
        time: Date.now()
    }

    const tokenOptions = {
        expiresIn: expDays * 24 * 60 * 60,
    }

    const token = jwt.sign(tokenData, JWT_SECRET_KEY, tokenOptions)

    return token
}

function checkAuthCookie(req, res, next) {
    const token = req.cookie["auth"]

    let result

    try {
        result = jwt.verify(token, JWT_SECRET_KEY)
    } catch (error) {
        req.clearCookie("auth")
        next()
    }

    req.user = result
    next()
}

module.exports = {
    getUserToken,
    checkAuthCookie
}