let express = require('express')
let router = express.Router()
let Post = require("../models/post.js")

/* GET users listing. */
router.get('/', function(req, res, next) { //목록
   Post.find(
              {
                    boardId: "free"
                },
              {
                    boardId: 1,
                    subject: 1,
                    userId: 1,
                    created: 1
                }
            )
        .sort({ created: -1 })
        .skip(0)
        .limit(5)
        .then( (ret) => {
                    res.send(ret)
                 }
             )
    /*
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
    */
})

router.get('/:id', function(req, res, next) { //게시글
    Post.findById(req.params.id).then(
        ( ret ) => {
            res.send( ret )
        }
    )
})

module.exports = router
