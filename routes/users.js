const express = require('express')
const router = express.Router()
const User = require("../models/user.js")
const mongoose = require('mongoose')
const { wrapAsync, makePasswordHashed, toPayload, createToken, bidirectDecrypt } = require("../apis/util.js")
const { verifyToken, encryptPassword, encryptJumin } = require('./middlewares.js')
const { PlainError } = require('../classes/errors.js')
const { ENCRYPT_PASSWORD } = require("../config.js")

//키워드를 받아 사용자 id 또는 이름에서 검색하여 사용자 배열을 반환
router.get("/userid-name/:keyword", wrapAsync(verifyToken), wrapAsync(async (req, res) => {

    const users = await User.find({
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

}))

//토큰을 받아서 _id 를 반환, 토큰은 실제 params 로 받지 않고 headers 로 받음
router.get("/token/:token", wrapAsync(verifyToken), wrapAsync(async (req, res) => {
    const user = await User.findById(req._id)
    res.status(200).json({
        status: 200,
        msg: "사용자 반환",
        user: user
    })
}))

//주민번호를 받아서 해당 사용자를 반환
router.get("/jumin1/:jumin1/jumin2/:jumin2/jumin3/:jumin3", wrapAsync(async (req, res) => {

    const { jumin1, jumin2, jumin3 } = req.params

    const users = await User.find({ jumin1: jumin1, jumin2: jumin2 }, { userId: 1, name: 1, salt: 1, jumin3: 1, cellphone: 1, email: 1 } )

    for (const user of users) {
        const jumin3Decrypted = bidirectDecrypt(user.jumin3, user.salt, ENCRYPT_PASSWORD)
        if ( jumin3Decrypted === jumin3 ) {
            // salt 와 jumin3 는 보안상 반납하지 않는다.
            user.salt = undefined
            user.jumin3 = undefined
            console.log(user)
            return res.status(200).json({
                status: 200,
                msg: "사용자 정보",
                user: user
            })
        }
    }

    // 해당 user 가 없는 경우에도 200 으로 응답 => Front 에서 분기하는 걸로 최종 결론
    return res.status(200).json({
        status: 200,
        msg: "사용자 정보",
        user: ""
    })

}))

// 헤더로 토큰을 받아 검사 결과를 status 와 data.type data.msg 등으로 반환
/*router.get("/check-token", wrapAsync(verifyToken), wrapAsync(async (req, res) => {
    return res.status(200).json({
        status: 200,
        msg: "정상 또는 갱신 토큰"
    })
}))*/

// 사용자 _id를 받아 해당 사용자 정보를 반환 '/:id'
router.get("/_id/:_id", wrapAsync(verifyToken), wrapAsync(async (req, res) => {

    const user = await User.findById(req.params._id)
    res.status(200).json({
        user
    })

}))

// is-userid 와 is-jumin 은 사용자 등록 시, 사용되므로 verifyToken 사용 안함, 향후 별도 보안 설정 필요
// 사용자 id 를 받아 해당 사용자 유무를 status 코드로 반환
router.get("/userid/:userId", wrapAsync(async (req, res) => {
    const user = await User.findOne( { userId: req.params.userId }, { userId: 1 } )
    if (user) {
        // return res.status(200).json({
        //     'status': 200,
        //     'msg': '같은 아이디 존재'
        // })
        throw new PlainError("같은 아이디 존재")
    }
    return res.status(200).json({
        status: 200,
        msg: '같은 아이디 미존재'
    })
}))

// 검색 내역을 받아 카운트와 사용자 배열을 반환
router.get("/", wrapAsync(verifyToken), wrapAsync(async (req, res) => {
    const payload = toPayload({
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
}))

// 사용자 id와 사용 정보를 받아 기존 사용자 document 를 업데이트
router.put("/:id", wrapAsync(verifyToken), wrapAsync(async (req, res) => {

    let updateObj = req.body
    updateObj.updated = new Date()

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updateObj },{ new: true })
    return res.status(200).json({
        status: 200,
        msg: "수정 완료",
        user
    })

}))

// 아이디와 비밀번호를 받아 로그인 처리
router.post('/login', wrapAsync(async (req, res) => {

    const { userId, password: plainPassword } = req.body

    const loggedUser = await User.findOne(
        { userId: userId },
        [ "salt", "password", "userId", "name", "jumin", "cellphone", "email", "face", "color"]
    )

    if (!loggedUser) throw new PlainError("아이디 또는 비밀번호가 일치하지 않음")

    const password = await makePasswordHashed(plainPassword, loggedUser.salt)

    if (password !== loggedUser.password) throw new PlainError("아이디 또는 비밀번호가 일치하지 않음")

    const token = await createToken(loggedUser._id)
    console.log("생성", new Date())

    //토큰은 헤더에 저장
    res.set('verified-token', token)

    return res.status(200).json({
        status: 200,
        msg: '사용자 인증 성공',
        user: loggedUser
    })

}))

//사용자 정보를 받아 새로운 사용자 저장
router.post("/by-user",
            wrapAsync(encryptPassword),
            wrapAsync(encryptJumin),
            wrapAsync(async (req, res) => {

    const { body: { user } } = req

    // const salt = await createSalt()
    // const password = await makePasswordHashed(user.password, salt)

    // console.log("user", user)

    const now = new Date()
    //console.log("now", now)

    //db에 저장되는 필드 순서를 감안하여 일일히 나열함
    const savedUser = await User.create({
        _id: new mongoose.Types.ObjectId(),
        userId: user.userId,
        password: user.passwordEncrypted,
        salt: user.salt,
        name: user.name,
        jumin1: user.jumin1,
        jumin2: user.jumin2,
        jumin3: user.jumin3Encrypted,
        cellphone: user.cellphone,
        email: user.email,
        face: user.face,
        color: user.color,
        agree: {
            terms: user.agree.terms,
            info: user.agree.info,
            jumin: user.agree.jumin,
            email: user.agree.email,
            sms: user.agree.sms
        },
        created: now,
        updated: now
    })
    // console.log("user.created", user.created)
    return res.status(200).json({
        status: 200,
        msg: "사용자에 의해 생성 완료",
        user: savedUser
    })
}))

router.post("/by-admin", wrapAsync(verifyToken), async (req, res) => {

    const { body: user } = req

    const now = new Date()
    //console.log("now", now)
    const savedUser = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: user.name,
        jumin1: user.jumin1,
        jumin2: user.jumin2,
        jumin3: user.jumin3,
        cellphone: user.cellphone,
        email: user.email,
        created: now,
        updated: now
    })
    // console.log("user.created", user.created)
    return res.status(200).json({
        status: 200,
        msg: "관리자에 의해 생성 완료",
        user: savedUser
    })

})

module.exports = router