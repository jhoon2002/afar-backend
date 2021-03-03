let express = require('express')
let router = express.Router()
let Post = require("../models/post.js")
let Employee = require("../models/employee.js")

/*
페이징: /api/posts?page=1&itemsPerPage=10&sortBy[]=created&sortDesc[]=true&mustSort=false&multiSort=false
*/

/* GET users listing. */
router.get('/', function(req, res, next) { //목록

    console.log("req.query", req.query)

    let page = req.query.page * 1
    let limit = req.query.itemsPerPage * 1

    let sort = {}
    if (req.query.sortBy) {
        for (let [index, value] of req.query.sortBy.entries()) {
            if (index == 0) sort = {}
            let field = value
            let desc = req.query.sortDesc[index] == "true" ? -1 : 1
            sort[field] = desc
        }
    }

    let filter = {}
    filter["boardId"] = req.query.boid ? req.query.boid : { '$exists': true }

    Post.countDocuments( filter ).then( (count) => {

        // console.log("count", count)

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

                    let set = new Set()
                    for ( let item of ret ) {
                        set.add(item.userId)
                    }

                    Employee.find( { userId: { $in: Array.from(set) } }, { userId: 1, name: 1} ).then((re) => {
                        let names = {}
                        for (let d of re) {
                            names[d.userId] = d.name
                        }
                        res.send(
                            {
                                page: page,
                                totalPage: totalPage,
                                totalCount: count,
                                sort: sort,
                                skip: skip,
                                limit: limit,
                                items: ret,
                                names: names
                            }
                        )
                    })
                }
            )
        }
    )
})

module.exports = router
