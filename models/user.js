let mongoose = require('mongoose')
let Schema = mongoose.Schema

let userSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: String,
    password: String,
    salt: String,
    name: String,
    jumin: String,
    cellphone: String,
    email: String,
    face: String,
    color: String,
    created: { type:Date, default:Date.now },
    updated: { type:Date, default:Date.now }
})

userSchema.statics.findByPayload = function(payload) {
    let query = this.find(payload.filter)
    if (payload.searcher.length > 0) {
        if (payload.and) {
            query.and(payload.searcher)
        } else {
            query.or(payload.searcher)
        }
    }
    query.sort(payload.sorter)
    query.skip(payload.pager.skip)
    query.limit(payload.pager.limit)
    return query.exec()
}

userSchema.statics.countByPayload = function(payload) {
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

module.exports = mongoose.model("user", userSchema)