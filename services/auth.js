const JWT_SECRET_KEY = "GASKBo124HY53RdC5ErDSQXpeIFFXmOkOLt4H4klZoh01qzFhHb72oCfR6SdvC47i4gZk5iODSSCCBaxpwGpXIbrFlPoxmfy0Jksvhl2kh7WobeAW7RjYmU9fVu6cut2"

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

    const result = jwt.verify(token, JWT_SECRET_KEY)

    console.log("TOKEN CHECK", result)
}

module.exports = {
    getUserToken,
    checkAuthCookie
}