const mongoose = require('mongoose')

let uri = "mongodb+srv://jeongok:1111@cluster0.nba3n.gcp.mongodb.net/jeongok?retryWrites=true&w=majority"

mongoose.connect(uri)

const db = mongoose.connection;

db.on("error", console.error)  // mongoDB 연동 실패
db.once("open", () => {
    console.log(">>>>>>>>>>>> 몽고DB가 연결되었습니다.") // mongoDB 연동 성공
})