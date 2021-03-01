var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
    _id: String,
    boardId: String,
    userId: String,
    subject: String,
    content: String,
    fixed: Boolean,
    created: { type:Date, default:Date.now },
    updated: { type:Date, default:Date.now },
    comments: Array,
});

postSchema.statics.findIt = function(id) {
    return this.findById(id).exec()
}

// model을 post로 만들면 특별한 이름을 지정하지 않으면
// mongoDB에서 알아서 Collection name을 알아서 복수형으로 해줍니다
// 그리하여 Collection name은 posts로 됩니다
module.exports = mongoose.model("post", postSchema);