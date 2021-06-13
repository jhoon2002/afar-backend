const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { PlainError } = require('../classes/errors.js')
const User = require("../models/user.js")
const { wrapAsync } = require("../apis/util.js")
const { verifyToken } = require('./middlewares.js')
const publicdir = "public/"
const facedir = "files/faces/"
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, publicdir + facedir)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
let upload = multer({ storage: storage })

//_id 와 파일명을 받아, 파일을 디스크에 저장하고 파일명을 db 에 저장
router.post("/face", wrapAsync(verifyToken), wrapAsync(upload.single("file")), wrapAsync(async function(req, res) {
    //multer의 처리 결과는 req.file 로 받음

    const user = await User.findByIdAndUpdate(req.body.user_id, {
        $set: {
            face: req.file.originalname,
            updated: new Date()
        }
    },{ new: true })

    return res.status(200).json({
        msg: "업로드 완료",
        file: req.file
    })

}))

//사용자 face 파일명을 받아서 삭제
router.delete("/face/:_id/:filename", wrapAsync(verifyToken), wrapAsync(async function(req, res) {

    const filePath = path.join(__dirname, "../" + publicdir + facedir, req.params.filename)

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            throw new PlainError("파일에 접근할 수 없음")
        }
        if (req.params.filename === "none.svg") {
            throw new PlainError("none.svg는 삭제할 수 없음")
        }
        fs.unlink(filePath, (err) => {
            if (err) {
                throw new PlainError("파일을 삭제할 수 없음")
            }
        })
    })

    await User.findByIdAndUpdate(req.params._id, {
        $set: {
            face: "",
            updated: new Date()
        }
    },{ new: true })

    res.status(200).json({
        status: 200,
        msg: "삭제 완료"
    })

}))

module.exports = router