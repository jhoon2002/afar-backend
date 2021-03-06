const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
// const cors = require('cors')
const jwt = require('jsonwebtoken')

const indexRouter = require('./routes/index')
const tokenRouter = require('./routes/token')
const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')
const organsRouter = require('./routes/organs')
const testsRouter = require('./routes/tests')
const filesRouter = require('./routes/files')
const multer = require('multer')
const mongoose = require('mongoose')
const Errors = require('./classes/errors.js')

// mongodb 연결
require("./connection.js")

const app = express()

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
app.use('/api/token', tokenRouter)
app.use('/api/users', usersRouter)
app.use("/api/posts", postsRouter)
app.use("/api/organs", organsRouter)
app.use("/api/tests", testsRouter)
app.use('/api/files', filesRouter)

/*
 * 이하 Error handler
 */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404))
})

// 일반 에러: 400
app.use(function (error, req, res, next) {
    if (error instanceof Errors.PlainError
        || error instanceof Errors.NoDataError) {
        console.log(error)
        return res.status(400).json({
            status: 400,
            msg: error.message
        })
    }
    next(error)
})

//JWT 토큰 에러
app.use(function (error, req, res, next) {

    const logContents = "\x1b[30m ..(error 419 401) Token was deleted(expired, bad key, etc..)"

    if (error instanceof jwt.TokenExpiredError) {
        console.log(logContents, error)
        return res.status(419).json({
            status: 419,
            type: "DELETE_REQUIRED",
            msg: error.message
        })
    }
    if ( error instanceof jwt.JsonWebTokenError
        || error instanceof jwt.NotBeforeError ) {
        console.log(logContents, error)
        return res.status(401).json({
            status: 401,
            type: "DELETE_REQUIRED",
            msg: error.message
        })
    }
    next(error)
})

// 모든 Mongoose 에러
app.use(function (error, req, res, next) {
    if (error instanceof mongoose.Error) {
        console.log(error)
        res.status(503).json({
            status: 503,
            message: error.message
        })
    }
    next(error)
})

//multer 에러
app.use(function (error, req, res, next) {
    if (error instanceof multer.MulterError) {
        console.log(error)
        return res.status(400).json({
            status: 400,
            msg: error.message
        })
    }
    next(error)
})

// 나머지 에러
app.use(function(err, req, res, next) {
    console.log(err)
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
})

// app.use('/upload', express.static('upload'));

module.exports = app
