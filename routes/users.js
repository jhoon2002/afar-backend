let express = require('express')
let router = express.Router()
let User = require("../models/user.js")
let mongoose = require('mongoose')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const moment = require("moment")
// const { toPayload } = require("../apis/util.js")
const util = require("../apis/util.js")
const fs = require('fs')
const path = require('path')
const { verifyToken, createToken } = require('./middlewares')

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
    const user = await User.findOne({ userId: userId }, [ "userId", "name", "salt", "password", "face"]).exec()
    //console.log(user)
    if (!user) return false
    const password = await makePasswordHashed(plainPassword, user.salt)
    if (password === user.password) return {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        face: user.face
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

// const intervalNumber = "12"
// const updateIntervalNumber = "-2"
// const intervalUnit = "s"
// const expiredInterval = intervalNumber + intervalUnit
// const updateInterval = updateIntervalNumber + intervalUnit

/*const getToken = (_id) => new Promise((resolve, reject) => {
    jwt.sign(
        {
            _id: _id
        },
        key,
        {
            expiresIn: expiredInterval,
            //issuer: 'K-Aco',
            //subject: '사용자 토큰'
        },
        (err, token) => {
            if (err) reject(err)
            resolve(token)
        })
})*/

/*const checkToken = token => new Promise((resolve, reject) => {
    jwt.verify(token, key, function (err, decoded) {
        if (err) reject(err)
        resolve(decoded)
    })
})*/

router.post('/login', async (req, res) => {

    const { userId, password } = req.body

    const loggedUser = await login(userId, password)

    if (!loggedUser) {
        res.status(403).json({
            "status": 403, //금지됨(비인가 상태)
            "msg": '로그인 실패'
        })
        return
    }

    try {
        // const token = await getToken(loggedUser._id)
        const token = await createToken(loggedUser._id)
        console.log("생성", new Date())

        //토큰은 헤더에 저장
        res.set('verified-token', token)

        return res.status(200).json({
            status: 200,
            msg: '사용자 인증 성공',
            _id: loggedUser._id,
            userId: loggedUser.userId,
            name: loggedUser.name,
            face: loggedUser.face,
            // token
        })
    } catch(e) {
        console.log(e)
        return res.status(401).json({
            "status": 401, //권한 없음(인증이 필요한 상태)
            "msg": '토큰 생성 실패'
        })
    }
})


/*router.get('/check-token', async (req, res) => {
    const oldToken = req.headers['token'] // || req.query.token

    //req에 토큰 자체가 없는 경우(400:잘못된 요청=>로그인 필요)
    if (!oldToken || oldToken === "null") {
        res.status(400).json({
            "status": 400, //잘못된 요청
            "msg": '토큰이 없습니다.'
        })
        return
    }

    try {
        const validToken = await checkToken(oldToken)

         // console.log("validToken", validToken)

        //토큰 갱신
        if (moment(new Date().getTime()) > moment(validToken.exp*1000).add(updateIntervalNumber, intervalUnit)) {
            const token = await getToken(validToken._id)
            res.status(201).json({
                status: 201,
                msg: '토큰 갱신',
                token
            })
            console.log("갱신", new Date())
            return
        }
        res.status(200).json({
            status: 200,
            msg: '정상 토큰',
            validToken
        })
    } catch(e) {

        console.log(e)

        // 유효기간이 초과된 경우
        if (e.name === 'TokenExpiredError') {
            return res.status(419).json({
                status: 419,
                msg: '토큰 만료'
            })
        }

        // 토큰의 비밀키가 일치하지 않는 경우
        return res.status(401).json({
            status: 401,
            msg: '유효하지 않은 토큰'
        })
    } finally {
        return
    }

})*/

router.get('/check-token', verifyToken, async (req, res) => {

     //console.log(res.getHeaders()["verified-token"])
     //console.log(req.headers.token)

    //if (res.getHeaders()["verified-token"] !== req.headers.token) {
    //    return res.status(201).json({
    //        status: 201,
    //        msg: "갱신 토큰"
    //    })
    //}
    return res.status(200).json({
        status: 200,
        msg: "정상 또는 갱신 토큰"
    })
})

router.get('/', verifyToken, async function (req, res) {
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

/*router.get('/:id', async function (req, res) {
    try {
        let user = await User.findById(req.params.id)
        // console.log(user)
        res.status(200).json({
            user
        })
    } catch(e) {
        console.log(e)
    }
})*/

router.get('/:id', verifyToken, async function (req, res) {
    try {
        let user = await User.findById(req.params.id)
        // console.log(user)
        res.status(200).json({
            user
        })
    } catch(e) {
        console.log(e)
    }
})

//is-userid 와 is-jumin 은 사용자 등록 시, 사용되므로 verifyToken 사용 안함, 향후 별도 보안 설정 필요
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

router.post('/is-jumin', async (req, res) => {
    const ret = await User.find( { jumin: req.body.jumin }, { jumin: 1 } )
    if (ret.length > 0) {
        return res.status(200).json({
            'status': 200,
            'msg': '같은 주민등록번호 존재'
        })
        return
    }
    return res.status(204).json({
        'status': 204,
        'msg': '같은 주민등록번호 미존재'
    })
    return
})

router.put("/:id", verifyToken, async (req, res) => {

    let updateObj = req.body
    updateObj.updated = new Date

    try {
        const user = await User.findByIdAndUpdate(req.params.id, { $set: updateObj },{ new: true })
        return res.status(200).json({
            "status": 200,
            "msg": "수정 완료",
            user
        })
    } catch {
        return res.status(304).json({
            status: 304,
            msg: "수정되지 않음"
        })
    }
})

router.post("/", verifyToken, async (req, res) => {
    try {
        const now = new Date()
        //console.log("now", now)
        const user = await User.create({
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            jumin: req.body.jumin,
            cellphone: req.body.cellphone,
            email: req.body.email,
            created: now,
            updated: now
        })
        // console.log("user.created", user.created)
        return res.status(200).json({
            "status": 200,
            "msg": "생성 완료",
            user
        })
    } catch(e) {
        console.log(e)
        return res.status(304).json({
            status: 304,
            msg: "생성 못함"
        })
    }
})

router.get("/is-useridname/:keyword", verifyToken, async (req, res) => {
    // console.log("req.params.keyword", req.params.keyword,)
    try {
        let users = await User.find({
            // userId: req.params.keyword,
            name: new RegExp(req.params.keyword, 'i')
        }, {
            userId: 1,
            name: 1,
            jumin: 1
        })
        //console.log("users", users)
        res.status(200).json({
            users
        })
    } catch(e) {
        console.log(e)
    }
})

const publicdir = "public/"
const facedir = "files/faces/"
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, publicdir + facedir)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
let upload = multer({ storage: storage })

router.post("/face", verifyToken, upload.single("file"), async function(req, res) {
    //multer의 처리 결과는 req.file 로 받음

    try {
        const user = await User.findByIdAndUpdate(req.body.user_id, {
                $set: {
                    face: req.file.originalname,
                    updated: new Date()
                }
            },{ new: true })

        res.status(200).json({
            msg: "업로드 완료",
            file: req.file
        })
    } catch(e) {
        console.log(e)
        return res.status(304).json({
            status: 304,
            msg: "수정되지 않음"
        })
    }
})

router.delete("/face/:_id/:filename", verifyToken, async function(req, res) {

    const filePath = path.join(__dirname, "../" + publicdir + facedir, req.params.filename)

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(304).json({
                status: 304,
                msg: "파일에 접근할 수 없음"
            })
        }
        if (req.params.filename === "none.svg") {
            return res.status(304).json({
                status: 304,
                msg: "none.svg는 삭제할 수 없음"
            })
        }
        fs.unlink(filePath, (err) => {
            if (err) {
                return res.status(304).json({
                    status: 304,
                    msg: "파일을 삭제할 수 없음"
                })
            }
        })
    })

    try {
        await User.findByIdAndUpdate(req.params._id, {
            $set: {
                face: "",
                updated: new Date()
            }
        },{ new: true })

        res.status(200).json({
            status: 200,
            msg: "삭제 완료"
        })

    } catch (e) {
        console.log(e)
        return res.status(304).json({
            status: 304,
            msg: "사용자 정보 수정 실패"
        })
    }
})

/*router.get('/_id/:by', async (req, res) => {

    const token = req.headers['token']
    if (!token || token === "null") {
        res.status(400).json({
            status: 400, //잘못된 요청
            msg: '토큰이 없습니다.'
        })
        return
    }
    try {
        const validToken = await checkToken(token)
        res.status(200).json({
            status: 200,
            msg: '정상 토큰',
            _id: validToken._id
        })
    } catch(e) {
        console.log(e)
        res.status(405).json({
            status: 405,
            msg: '토큰 검사 중 에러'
        })
    }

})*/

router.get('/_id/:by', verifyToken, async (req, res) => {

    return res.status(200).json({
        status: 200,
        msg: '정상 토큰',
        _id: req._id
    })

})

module.exports = router
