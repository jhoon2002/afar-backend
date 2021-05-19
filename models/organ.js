let mongoose = require('mongoose')
let Schema = mongoose.Schema
mongoose.set('useCreateIndex', true)

const staffSchema = new Schema({
    user_id: String,
    name: String,
    role: String
})

const childSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    text: String,
    chief: String,
    blank: Boolean,
    children: [ {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'childSchema'
    } ],
    staffs: [ staffSchema ]
})

let organSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    childSchema,
    created: { type:Date, default:Date.now },
    updated: { type:Date }
})

module.exports = mongoose.model("organ", organSchema)