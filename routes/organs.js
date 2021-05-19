let express = require('express')
let router = express.Router()
let Organ = require("../models/organ.js")

router.post("/", async function(req, res) {

    try {
        let organ = req.body.organ
        organ._id = new mongoose.Types.ObjectId()

        const now = new Date()
        organ.created = now
        organ.updated = now
        organ = await Organ.create(organ)

        return res.status(200).json({
            status: 200,
            msg: "생성 완료",
            organ
        })
    } catch(e) {
        console.log(e)
        return res.status(304).json({
            status: 304,
            msg: "생성 못함"
        })
    }

})

router.get("/", async function(req, res) {

    try {
        const organ = await Organ.find().sort({ _id: -1 }).limit(1)
        return res.status(200).json({
            status: 200,
            msg: "생성 완료",
            organ
        })
    } catch(e) {
        console.log(e)
        return res.status(204).json({
            status: 204,
            msg: "데이터 없음"
        })
    }

})

module.exports = router