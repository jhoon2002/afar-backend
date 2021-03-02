let express = require('express')
let router = express.Router()
let Post = require("../models/post.js")

/*

페이징: http://localhost:3000/api/posts?boid=free&page=1&limit=10&field=created&desc=true
포스트: /api/post/?boid=free&100001?page=1&limit=10&field=created&desc=true

 */

/* GET users listing. */
router.get('/', function(req, res, next) { //목록

    let boardId = req.query.boid
    let page = req.query.page * 1
    let limit = req.query.limit * 1
    let count = 0
    let totalPage = 0
    let skip = 0

    Post.countDocuments(
            {
                boardId: boardId
            }
        ).then(
            (count) => {

                totalPage = parseInt( (count - 1) / limit ) + 1
                skip = ( page - 1 ) * limit

                Post.find(
                        {
                            boardId: boardId
                        },
                        {
                            boardId: 1,
                            subject: 1,
                            userId: 1,
                            created: 1
                        }
                    )
                    .sort({ created: -1 })
                    .skip(skip)
                    .limit(limit)
                    .then(
                        (data) => {
                            res.send(
                                {
                                    meta: {
                                        page: page,
                                        totalPage: totalPage,
                                        totalCount: count,
                                        skip: skip,
                                        limit: limit
                                    },
                                    data: data
                                }
                            )
                        }
                    )
            }
        )
})
/*
    let totalPage = parseInt( (count - 1) / limit ) + 1
    let skip = ( page - 1 ) * limit

    Post.find(
        {
            boardId: boardId
        },
    {
            boardId: 1,
            subject: 1,
            userId: 1,
            created: 1
        }
    )
    .sort({ created: -1 })
    .skip(skip)
    .limit(limit)
    .then(
        (ret) => {
            res.send(
                {
                    totalCount: count,
                    totalPage: totalPage,
                    data: ret
                }
            )
        }
     )
    /-*
    Post.aggregate([
        {'$project': { 'boardId': 1, 'subject': 1, 'userId': 1, 'created': 1 } },
        {'$match': { 'boardId': 'free' } },
        {'$skip': 1},
        {'$limit': 3}
    ]).then(
        ( ret ) => {
            res.send( ret )
        }
    )
    *-/
})

router.get('/:id', function(req, res, next) { //게시글
    Post.findById(req.params.id).then(
        ( ret ) => {
            res.send( ret )
        }
    )
})

*/
module.exports = router
