let express = require('express')
let mongoose = require('mongoose')
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
        created: 1,
        commentCount: 1
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

    let userIdSet = loopAndFindUserIdInPosts(ret, new Set())

    let names = await namesMap(userIdSet)

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
    let ret = await Post.findById(id).exec()
    let userIdSet = loopAndFindUserIdInPost(ret, new Set())
    let names = await namesMap(userIdSet)
    return {
        item: ret,
        names: names
    }
}

function loopAndFindUserIdInPosts(obj, set) {
    for (let item of obj) {
        set.add(item.userId)
    }
    return set
}

function loopAndFindUserIdInPost(obj, set) {
    set.add(obj.userId)
    if (obj.comments && obj.comments.length > 0) {
        for (let item of obj.comments) {
            loopAndFindUserIdInPost(item, set)
        }
    }
    return set
}

async function namesMap(set) {
    let arr = await nameDocs(set)
    let map = {}
    for (let item of arr) {
        map[item.userId] = item.name
    }
    return map
}

async function savePost(params) {
    return await Post.create({
        _id: new mongoose.Types.ObjectId(),
        boardId: "free",
        userId: "jhoon",
        subject: "테슬라 주가 600달러 붕괴..고점 찍고 5주 새 300조원 증발",
        content: "미국 전기자동차 업체 테슬라 주가가 고꾸라지며 3개월여 만에 600달러 아래로 내려왔다. 테슬라는 5일(현지시간) 미국 뉴욕 증시에서 3.78% 하락한 597.95달러로 장을 마쳤다.",
    })
}

router.get('/', function (req, res) {
    getPosts(req).then(ret => res.send(ret)).catch(console.log)
})

router.get('/:id', function (req, res) {
    getPost(req.params.id).then(ret => res.send(ret)).catch(console.log)
})

router.post("/", function(req, res) {
    let post = req.body
    post._id = new mongoose.Types.ObjectId()
    Post.create(post).then(ret => {
        res.send(ret)
    }).catch(console.log)
})

/* 경과시간 측정
let startTime = new Date().getMilliseconds()
    .finally( () => {
        let endTime = new Date().getMilliseconds()
        console.log("경과시간(ms)", endTime - startTime)
    })
 */
module.exports = router
