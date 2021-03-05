let express = require('express')
let router = express.Router()
let Post = require("../models/post.js")
let Employee = require("../models/employee.js")

/*
페이징: /api/posts?page=1&itemsPerPage=10&sortBy[]=created&sortDesc[]=true&mustSort=false&multiSort=false
*/

async function count(filter) {
    return await Post.countDocuments(filter).exec()
}

async function find(filter, sort, skip, limit) {
    return await Post.find(filter, {
        boardId: 1,
        subject: 1,
        userId: 1,
        created: 1
    })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec()
}

async function nameDocs(set) {
    return await Employee.find({
            userId: {$in: Array.from(set)}
        },
        {userId: 1, name: 1}
    ).exec()
}

async function getPosts(req) {

    let page = req.query.page * 1
    let limit = req.query.itemsPerPage * 1

    let sort = {}
    if (req.query.sortBy) {
        for (let [index, value] of req.query.sortBy.entries()) {
            // if (index == 0) sort = {}
            let field = value
            let desc = req.query.sortDesc[index] == "true" ? -1 : 1
            sort[field] = desc
        }
    }

    let filter = {}
    filter["boardId"] = req.query.boid ? req.query.boid : {'$exists': true}

    let cnt = await count(filter)

    let totalPage = parseInt((cnt - 1) / limit) + 1
    let skip = (page - 1) * limit

    let ret = await find(filter, sort, skip, limit)

    let set = new Set()
    for (let item of ret) {
        set.add(item.userId)
    }

    let arr = await nameDocs(set)
    let names = {}
    for (let d of arr) {
        names[d.userId] = d.name
    }

    return {
        page: page,
        totalPage: totalPage,
        totalCount: cnt,
        sort: sort,
        skip: skip,
        limit: limit,
        items: ret,
        names: names
    }
}

async function getPost(id) {
    return await Post.findById(id).exec()
}

router.get('/', function (req, res) {
    getPosts(req).then(ret => res.send(ret)).catch(console.log)
})

router.get('/:id', function (req, res) {
    getPost(req.params.id).then(ret => res.send(ret)).catch(console.log)
})

/* 경과시간 측정
let startTime = new Date().getMilliseconds()
    .finally( () => {
        let endTime = new Date().getMilliseconds()
        console.log("경과시간(ms)", endTime - startTime)
    })
 */
module.exports = router
