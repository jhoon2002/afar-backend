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

postSchema.statics.countAllPosts = function(filter) {
    return this.countDocuments(filter).exec()
}

// model을 post로 만들면 특별한 이름을 지정하지 않으면
// mongoDB에서 알아서 Collection name을 알아서 복수형으로 해줍니다
// 그리하여 Collection name은 posts로 됩니다
module.exports = mongoose.model("post", postSchema)