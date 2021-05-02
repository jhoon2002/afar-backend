const mongoose = require('mongoose')

let uri = "mongodb+srv://jeongok:1111@cluster0.nba3n.gcp.mongodb.net/jeongok?retryWrites=true&w=majority"

mongoose.set('useFindAndModify', false)

mongoose.connect(
    uri,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    }
)
//mongoose.connect(uri) //deprecated 되었다고 함 option을 붙여야..

const db = mongoose.connection;

db.on("error", console.error)  // mongoDB 연동 실패
db.once("open", () => {
    console.log(">>>>>>>>>>>> 몽고DB가 연결되었습니다.") // mongoDB 연동 성공
})