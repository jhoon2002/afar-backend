const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { encryptJumin } = require('./middlewares')
const { wrapAsync } = require("../apis/util.js")


router.get("/some", wrapAsync(encryptJumin), wrapAsync( (req, res) => {

    console.log(req.query)

    return res.status(200).json({
        status: 200,
        msg: '테스트 성공',
        jumin3: req.query.j,
        jumin3Encrypted: req.jumin3Encrypted,
        jumin3Decrypted: req.jumin3Decrypted
    })
}))

module.exports = router