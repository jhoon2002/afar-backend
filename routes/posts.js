let express = require('express')
let router = express.Router()
let Post = require("../models/post.js")

/*
페이징: http://localhost:3000/api/posts?boid=free&page=1&limit=10&field=created&desc=true
포스트: http://localhost:3000/api/post/?boid=free&100001?page=1&limit=10&field=created&desc=true
*/

/* GET users listing. */
router.get('/', function(req, res, next) { //목록

    console.log("req.query", req.query)

    let page = req.query.page * 1
    let limit = req.query.itemsPerPage * 1

    let sort = {}
    for ( let i = 0; i < req.query.sortBy.length; i++ ) {
        let field = req.query.sortBy[i]
        let desc = req.query.sortDesc[i] == "true" ? -1 : 1
        sort[field] = desc
    }

    let filter = {}
    filter["boardId"] = req.query.boid ? req.query.boid : { '$exists': true }

    Post.countDocuments( filter ).then( (count) => {

        console.log("count", count)

                let totalPage = parseInt( (count - 1) / limit ) + 1
                let skip = ( page - 1 ) * limit

                Post.find( filter,
                    {
                            boardId: 1,
                            subject: 1,
                            userId: 1,
                            created: 1
                        }
                    )
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .then(
                        (ret) => {
                            res.send(
                                {
                                    page: page,
                                    totalPage: totalPage,
                                    totalCount: count,
                                    sort: sort,
                                    skip: skip,
                                    limit: limit,
                                    items: ret
                                }
                            )
                        }
                    )
            }
        )
})

module.exports = router
