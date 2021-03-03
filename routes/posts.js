let express = require('express')
let router = express.Router()
let Post = require("../models/post.js")
let Employee = require("../models/employee.js")

/*
페이징: /api/posts?page=1&itemsPerPage=10&sortBy[]=created&sortDesc[]=true&mustSort=false&multiSort=false
*/

let count = function(req, res, next) {

    let page = req.query.page * 1
    let limit = req.query.itemsPerPage * 1

    let filter = {}
    filter["boardId"] = req.query.boid ? req.query.boid : { '$exists': true }

    Post.countDocuments( filter ).then( (cnt) => {
        let totalPage = parseInt((cnt - 1) / limit) + 1
        let skip = (page - 1) * limit
        console.log(page, limit, cnt, totalPage, skip)
    })
    next()
}

router.get('/', count, function(req, res, next) { //목록
    console.log("===========")
    res.send("-------------")
})

module.exports = router
