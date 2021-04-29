let express = require('express')
let mongoose = require('mongoose')
let router = express.Router()
let User = require("../models/user.js")
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const moment = require("moment")
// const { toPayload } = require("../apis/util.js")
const util = require("../apis/util.js")

const createSalt = () =>
    new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (err) reject(err);
            resolve(buf.toString('base64'));
        });
    });

const createHashedPassword = (plainPassword) =>
    new Promise(async (resolve, reject) => {
        const salt = await createSalt();
        crypto.pbkdf2(plainPassword, salt, 9999, 64, 'sha512', (err, key) => {
            if (err) reject(err);
            resolve({ password: key.toString('base64'), salt });
        });
    });

const makePasswordHashed = (plainPassword, salt) =>
    new Promise(async (resolve, reject) => {
        crypto.pbkdf2(plainPassword, salt, 9999, 64, 'sha512', (err, key) => {
          if (err) reject(err);
          resolve(key.toString('base64'));
        });
    });

async function login(userId, plainPassword) {
    if (!userId || !plainPassword) return false
    const user = await User.findOne({ userId: userId }, [ "userId", "name", "salt", "password"]).exec()
    if (!user) return false
    const password = await makePasswordHashed(plainPassword, user.salt)
    if (password === user.password) return {
        userId: user.userId,
        name: user.name
    }
    return false
}

const getPassword = async plainPassword => {
    const salt = await createSalt()
    const passwordHashed = await makePasswordHashed(plainPassword, salt)
    return {
        salt: salt,
        password: passwordHashed
    }
}

const key = "U-Koz56^--Yui"
const expiredInterval = "1" //m
const updateInterval = "-30" //s

const getToken = (userId, name) => new Promise((resolve, reject) => {
    jwt.sign(
        {
            userId: userId,
            name: name
        },
        key,
        {
            expiresIn: expiredInterval + "m",
            //issuer: 'K-Aco',
            //subject: '사용자 토큰'
        },
        (err, token) => {
            if (err) reject(err)
            resolve(token)
        })
})

const checkToken = token => new Promise((resolve, reject) => {
    jwt.verify(token, key, function (err, decoded) {
        if (err) reject(err)
        resolve(decoded)
    })
})

router.post('/login', async (req, res) => {

    const userId = req.body.userId
    const password = req.body.password

    const loggedUser = await login(userId, password)

    if (!loggedUser) {
        res.status(403).json({
            "status": 403, //금지됨(비인가 상태)
            "msg": '로그인 실패'
        })
        return
    }

    try {
        const token = await getToken(loggedUser.userId, loggedUser.name)
        console.log("생성", new Date())
        res.status(200).json({
            "status": 200,
            "msg": '토큰 생성',
            token
        })
    } catch {
        res.status(401).json({
            "status": 401, //권한 없음(인증이 필요한 상태)
            "msg": '토큰 생성 실패'
        })
    } finally {
        return
    }
})

router.post('/refresh-token', (req, res) => {
    return res.status(200).json({
        'token': 'new_token',
        'status': 200
    })
})

router.get('/check-token', async (req, res) => {
    const token = req.headers['token'] // || req.query.token

    //req에 토큰 자체가 없는 경우(400:잘못된 요청=>로그인 필요)
    if (!token || token === "null") {
        res.status(400).json({
            "status": 400, //잘못된 요청
            "msg": '토큰이 없습니다.'
        })
        return
    }

    try {
        const validToken = await checkToken(token)

        // console.log("validToken", validToken)

        //토큰 갱신
        if (moment(new Date().getTime()) > moment(validToken.exp*1000).add(updateInterval, "s")) {
            const newToken = await getToken(validToken.userId, validToken.name)
            res.status(201).json({
                'status': 201,
                'msg': '갱신 토큰',
                newToken
            })
            console.log("갱신", new Date())
            return
        }
        res.status(200).json({
            'status': 200,
            'msg': '정상 토큰',
            validToken
        })
    } catch(e) {
        // console.log(e)
        res.status(401).json({
            'status': 401,
            'msg': '유효하지 않은 토큰이거나 토큰 갱신 중 에러'
        })
    } finally {
        return
    }

})

router.post('/is-userid', async (req, res) => {

    const ret = await User.find( { userId: req.body.userId }, { userId: 1 } )
    if (ret.length > 0) {
        return res.status(200).json({
            'status': 200,
            'msg': '같은 아이디 존재'
        })
        return
    }
    return res.status(204).json({
        'status': 204,
        'msg': '같은 아이디 미존재'
    })
    return
})

router.get('/', async function (req, res) {
    const payload = util.toPayload({
        filt: {
            // boardId: req.query["search.boardId"] //이 라인을 search: 으로 이동시키면 front에서 게시판 명을 검색 옵션으로 사용 가능할 듯
        },
        search: { //검색에 사용할 필드만 명시
            // _id: req.query["search._id"],
            userId: req.query["search.userId"],
            name: req.query["search.name"],
            cellphone: req.query["search.cellphone"],
            email: req.query["search.email"],
        },
        sort: {
            fields: req.query.sortBy,
            descs: req.query.sortDesc
        },
        paging: {
            page: req.query.page * 1,
            limit: req.query.itemsPerPage * 1
        },
        and: req.query.and
    })

    const count = await User.countByPayload(payload)
    const items = await User.findByPayload(payload)
    // console.log("items", items)

    return res.status(200).json({
        totalPages: parseInt((count - 1) / payload.limit) + 1,
        count: count,
        items: items
    })
})

router.get('/:id', async function (req, res) {
    try {
        let user = await User.findById(req.params.id)
        res.status(200).json({
            user
        })
    } catch(e) {
        console.log(e)
    }
})
module.exports = router
