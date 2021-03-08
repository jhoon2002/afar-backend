let express = require('express')
let mongoose = require('mongoose')
let router = express.Router()
let Post = require("../models/post.js")
let Employee = require("../models/employee.js")


/*
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
*/

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

/*
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
function search(query, field, word, and) {
    let objs = []
    let arr = field.split("+")
    for (let item of arr) {
        let obj = {}
        obj[item] = new RegExp(word, 'i')
        objs.push(obj)
    }

    if (and) return query.and(objs)
    return query.or(objs)
}
function sort(query, fields, desc) {
    let sort = {}
    for (let [index, field] of fields.entries()) {
        sort[field] = desc[index] == "true" ? -1 : 1
    }
    return query.sort(sort)
}
async function all(req, res) {

    //Query 생성
    let CountQuery = getCountQuery(req.query.boid)
    let findQuery = getQuery(req.query.boid)

    //add search
    if (req.query.searchField && req.query.searchWord) {
        let and = req.query.and == "true" ? true : false
        CountQuery = search(CountQuery, req.query.searchField, req.query.searchWord, and)
        findQuery = search(findQuery, req.query.searchField, req.query.searchWord, and)
    }

    //console.log(CountQuery)

    //Query #1(count) 실행
    let cnt = await CountQuery.exec()

    //변수 계산
    let page = req.query.page * 1
    let limit = req.query.itemsPerPage * 1
    let skip = (page - 1) * limit
    let totalPage = parseInt((cnt - 1) / limit) + 1

    //add sort
    if (req.sortBy) {
        findQuery = sort(q, req.query.sortBy, req.query.sortDesc)
    }

    //add skip
    findQuery.skip(skip)

    //add limit
    findQuery.limit(limit)

    //Query #2(find) 실행
    let ret = await findQuery.exec()

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
*/

function toPayload(queryStringObj) {

    let qso = queryStringObj
    //filter: Obj
    let filter = qso.boardId ? { boardId: qso.boardId } : {}

    //searcher: Array
    let searcher = []

    let io = qso.search
    for (let key in io) {
        if (io[key]) {
            let obj = {}
            obj[key] = new RegExp(io[key], 'i')
            searcher.push(obj)
        }
    }
    //sorter: Obj
    let sorter = {}

    let fields = qso.sort.fields

    let descs = qso.sort.descs

    for (let [index, field] of fields.entries()) {
        sorter[field] = descs[index] == "true" ? -1 : 1
    }

    return {
        skip: (qso.page - 1) * qso.limit,
        limit: qso.limit * 1,
        filter: filter,
        searcher: searcher,
        sorter: sorter,
        and: qso.and
    }

}

async function getPosts(payload) {
    let count = await Post.countByPayload(payload)
    let ret = await Post.findByPayload(payload)

    return {
        totalPages: parseInt((count - 1) / payload.limit) + 1,
        count: count,
        items: ret
    }
}

router.get('/', function (req, res) {

    let payload = toPayload({
        page: req.query.page,
        limit: req.query.itemsPerPage,
        boardId: req.query["search.boardId"], //이 라인을 search: 으로 이동시키면 front에서 게시판 명을 검색 옵션으로 사용 가능할 듯
        sort: {
            fields: req.query.sortBy,
            descs: req.query.sortDesc
        },
        search: { //검색에 사용할 필드만 명시
            _id: req.query["search._id"],
            userId: req.query["search.userId"],
            subject: req.query["search.subject"],
            content: req.query["search.content"],
        },
        and: req.query.and
    })

    console.log(req.query.sortBy)
    console.log(payload.searcher)

    // all(req).then(ret => res.send(ret)).catch(console.log)

    getPosts(payload).then(ret => {
        // console.log(ret)
        res.send(ret)
    }).catch(console.log)

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

/*
조회, 검색 컨벤션

===== FRONT (주로 vuetify 체계에 따름) ====
<Parameter>
-------------------------------------------------
명칭                Parameter 속성  실제 속성
-------------------------------------------------
페이지:               page           Number
페이지 당 목록 수:     itemPerPage    Number
정렬 필드:            sortBy         Array
    방식:            sortDesc       Boolean
그룹 필드:            groupBy        Array
    정렬 방식:        groupDesc      Boolean
멀티 정렬:            multiSort      Boolean
Must Sort:           mustSort       Boolean
  * 이상 vuetify에서 사용되는 파라메터로서, 이를 수용하여 이 명칭 및 체계에 따름
  * 멀티 정렬의 경우 multiSort 값에 상관없이 sortBy 값이 배열인지 여부에 따라 적용(2021-03-07 현재)
  * 그룹 필드는 아직 사례가 없어 반영 안함(2021-03-07 현재)

검색:                item.필드명      String
                       .....
    -----------------------------------------------------
    예)검색
     item.subject=국민&item.content=바다&item.name=여종훈
    -----------------------------------------------------

검색 조건:            and          Boolean
 */
