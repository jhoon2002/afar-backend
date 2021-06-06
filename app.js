let createError = require('http-errors')
let express = require('express')
let path = require('path')
let cookieParser = require('cookie-parser')
let logger = require('morgan')
// const cors = require('cors')

let indexRouter = require('./routes/index')
let usersRouter = require('./routes/users')
let postsRouter = require('./routes/posts')
let organsRouter = require('./routes/organs')

// mongodb 연결
require("./connection.js")

let app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
// app.use(cors({
//   exposedHeaders: ['newToken', 'badToken']
// }))

app.use('/', indexRouter)
app.use('/api/users', usersRouter)
app.use("/api/posts", postsRouter)
app.use("/api/organs", organsRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})


/*
 * 이하 Error handler
 */
const NoDataError = require('./classes/errors.js')

// 모든 NoDataError 400으로
app.use(function (error, req, res, next) {
  if (error instanceof NoDataError) {
    res.status(400).json({
      type: "NoDataError",
      message: error.message,
    })
  }
})

// 모든 Mongo DB 상의 에러는 503으로
// app.use(function handleDatabaseError(error, req, res, next) {
//   if (error instanceof MongoError) {
//     res.status(503).json({
//       type: "MongoError",
//       message: error.message,
//     })
//   }
//   next(error)
// })

// 나머지 에러
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

// app.use('/upload', express.static('upload'));

module.exports = app
