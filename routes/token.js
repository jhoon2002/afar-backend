const express = require('express')
const router = express.Router()
const { wrapAsync } = require("../apis/util.js")
const { verifyToken } = require('./middlewares')

// 헤더로 토큰을 받아 검사 결과를 status 와 data.type data.msg 등으로 반환
router.get("/verify", wrapAsync(verifyToken), wrapAsync(async (req, res) => {
    return res.status(200).json({
        status: 200,
        msg: "정상 또는 갱신 토큰"
    })
}))

module.exports = router