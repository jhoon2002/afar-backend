let mongoose = require('mongoose')
let Schema = mongoose.Schema

let userSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: String,
    password: String,
    salt: String,
    name: String,
    no: String,
    jumin: String,
    cellphone: Boolean,
    email: String,
    status: {
        type: String,
        part: String
    },
    created: { type:Date, default:Date.now },
    updated: { type:Date, default:Date.now }
})

/*userSchema.statics.findSomeone = function(userId) {

    // return this.findById(id, ["userId", "password", "salt"] ).exec()
    return this.findById(userId).exec()

}*/

// model을 post로 만들면 특별한 이름을 지정하지 않으면
// mongoDB에서 알아서 Collection name을 알아서 복수형으로 해줍니다
// 그리하여 Collection name은 posts로 됩니다
module.exports = mongoose.model("user", userSchema)