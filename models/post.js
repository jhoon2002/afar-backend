let mongoose = require('mongoose')
let Schema = mongoose.Schema

let postSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    boardId: String,
    userId: String,
    subject: String,
    content: String,
    fixed: Boolean,
    created: { type:Date, default:Date.now },
    updated: { type:Date },
    commentCount: Number,
    comments: Array,
})

postSchema.statics.findByPayload = function(payload) {
    let query = this.find(payload.filter)
    if (payload.searcher.length > 0) {
        if (payload.and) {
            query.and(payload.searcher)
        } else {
            query.or(payload.searcher)
        }
    }
    query.sort(payload.sorter)
    query.skip(payload.skip)
    query.limit(payload.limit)
    return query.exec()
}

postSchema.statics.countByPayload = function(payload) {
    let query = this.countDocuments(payload.filter)
    if (payload.searcher.length > 0) {
        if (payload.and) {
            query.and(payload.searcher)
        } else {
            query.or(payload.searcher)
        }
    }
    return query.exec()
}

// model을 post로 만들면 특별한 이름을 지정하지 않으면
// mongoDB에서 알아서 Collection name을 알아서 복수형으로 해줍니다
// 그리하여 Collection name은 posts로 됩니다

module.exports = mongoose.model("post", postSchema)