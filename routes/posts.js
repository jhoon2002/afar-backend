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
/* 참고자료
var query = Model.find();

var filters = [
    {fieldName: "year", value: "2014"},
    {fieldName: "cat", value: "sonny"}
    ...
];

for (var i = 0; i < filters.length; i++) {
    query.where(filters[i].fieldName).equals(filters[i].value)
}

query.exec(callback);
 */
function getQuery(boardId) {

    let filter = {}
    //filter["boardId"] = req.query.boid ? req.query.boid : {'$exists': true}
    if (boardId) {
        filter["boardId"] = boardId
    }

    return Post.find(filter)

}

function getCountQuery(boardId) {
    let filter ={}
    if (boardId) {
        filter["boardId"] = boardId
    }
    return Post.countDocuments(filter)
}

function search(q, field, word) {
    let or = {}
    let arr = field.split("+")
    for (let item of arr) {
        or[item] = new RegExp(word, 'i')
    }
    console.log("or", or)
    return q.or(or)
}

function sort(q, fields, desc) {
    let sort = {}
    for (let [index, field] of fields.entries()) {
        sort[field] = desc[index] == "true" ? -1 : 1
    }
    return q.sort(sort)
    // return await Post.find
}

async function all(req, res) {

    //Query 생성
    let qCnt = getCountQuery(req.query.boid)
    let q = getQuery(req.query.boid)

    //add search
    if (req.query.searchField && req.query.searchWord) {
        qCnt = search(qCnt, req.query.searchField, req.query.searchWord)
        q = search(q, req.query.searchField, req.query.searchWord)
    }

    //Query #1(count) 실행
    let cnt = await qCnt.exec()
    
    //변수 계산
    let page = req.query.page * 1
    let limit = req.query.itemsPerPage * 1
    let skip = (page - 1) * limit
    let totalPage = parseInt((cnt - 1) / limit) + 1

    //add sort
    if (req.sortBy) {
        q = sort(q, req.query.sortBy, req.query.sortDesc)
    }

    //add skip
    q.skip(skip)

    //add limit
    q.limit(limit)

    //Query #2(find) 실행
    let ret = await q.exec()

    let userIdSet = loopAndFindUserIdInPosts(ret, new Set())
    let names = await namesMap(userIdSet)

    return {
        page: page,
        totalPage: totalPage,
        totalCount: cnt,
        skip: skip,
        limit: limit,
        items: ret,
        names: names
    }
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

    //filter
    let filter = {}
    //filter["boardId"] = req.query.boid ? req.query.boid : {'$exists': true}
    if (req.query.boid) {
        filter["boardId"] = req.query.boid
    }
    if (req.query.searchField && req.query.searchWord) {
        let arr = req.query.searchField.split("+")
        for (let item of arr) {
            filter[item] = new RegExp(req.query.searchWord, 'i')
        }
    }
    console.log(filter)

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

router.get('/', function (req, res) {
    // getPosts(req).then(ret => res.send(ret)).catch(console.log)
    all(req).then(ret => res.send(ret)).catch(console.log)
})

router.get('/:id', function (req, res) {
    getPost(req.params.id).then(ret => res.send(ret)).catch(console.log)
})

router.post("/", function (req, res) {
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
