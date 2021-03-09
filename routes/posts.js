let express = require('express')
let mongoose = require('mongoose')
let router = express.Router()
let Post = require("../models/post.js")
let Employee = require("../models/employee.js")

function toPayload(queryStringObj) {

    let qso = queryStringObj

    //filter: Obj
    let filter = qso.filt ? qso.filt : {}

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
    if (fields) {
        for (let [index, field] of fields.entries()) {
            sorter[field] = descs[index] === "true" ? -1 : 1
        }
    }

    //pager: Obj
    let pager = {
        skip: (qso.paging.page - 1) * qso.paging.limit,
        limit: qso.paging.limit
    }

    return { //payload
        filter: filter,
        searcher: searcher,
        sorter: sorter,
        pager: pager,
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

async function getPost(id) {
    let ret = await Post.findById(id)
    return ret
}

router.get('/', function (req, res) {
    let payload = toPayload({
        filt: {
            boardId: req.query["search.boardId"] //이 라인을 search: 으로 이동시키면 front에서 게시판 명을 검색 옵션으로 사용 가능할 듯
        },
        search: { //검색에 사용할 필드만 명시
            _id: req.query["search._id"],
            userId: req.query["search.userId"],
            subject: req.query["search.subject"],
            content: req.query["search.content"],
        },
        sort: {
            fields: req.query.sortBy,
            descs: req.query.sortDesc
        },
        paging: {
            page: req.query.page * 1,
            limit: req.query.itemsPerPage * 1
        },
        and: req.query.and
    })

    console.log("payload", payload)

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

module.exports = router

/*

====== 조회, 검색 컨벤션 ======

1. FRONT (주로 vuetify 체계에 따름)
<Parameter=QueryString>
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


2. Backend

<QueryStringObject>
filt: { //향후 필터가 되는 객체
    필드: 값
},
search: { //검색에 사용할 객체(이때 검색은 %검색어%)
    필드: 값
},
sort: { //소트에 사용할 객체
    fields: (=sortBy), //배열
    descs: (=sortDesc) //배열
},
paging: { //페이징에 사용할 객체
    page: (=page)
    limit: (=itemsPerPage)
},
and: req.query.and //검색조건

<Payload>
filter: { //obj
    필드: 값
    ...
}
searcher: [ //array
    { 필드: 값 },
    { 필드: 값 },
    ...
]
sorter: { //obj
    필드: 1/-1,
    ...
}
pager: { //obj
    skip: 값,
    limit: 값
}
and: 값 //boolean
*/

/* 경과시간 측정
let startTime = new Date().getMilliseconds()
    .finally( () => {
        let endTime = new Date().getMilliseconds()
        console.log("경과시간(ms)", endTime - startTime)
    })
*/
