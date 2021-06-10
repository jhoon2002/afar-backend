const jwt = require('jsonwebtoken')
const moment = require("moment")
const { NoTokenError } = require("../classes/errors.js")
const crypto = require('crypto')

//토큰 key
const key = "U-Koz56^--Yui"

/*
 * 토큰 기간
 *
 *  |-----------------(1)intervalNumber------------------|
 *  |------(2)---------|-----(3)updateIntervalNumber-----|------(4)----->
 *
 *  (1)intervalNumber: 토큰의 유효기간, 이 사이 토큰 생존
 *  (2)이 기간에 Express로 접속되면, 검사는 하되 토큰은 갱신하지 않음
 *  (3)updateIntervalNumber: 이 기간에 Express로 접속되면, 검사하고
 *     intervalNumber의 기간을 갖는 새로운 토큰을 발급함(갱신)
 *  (4)토큰 기간 경과로 예외 발생(TokenExpiredError)
 *
 */
const intervalNumber = "60"
const updateIntervalNumber = "-30"
const intervalUnit = "m"
const expiredInterval = intervalNumber + intervalUnit

/*
jwt 시간단위가 vue-cookies와 다름에 유의

<jwt>
시간(h), 분(m), 일(days/d(?))

<vue-cookies>
시간(h), 분(min), 초(s), 월(m)
 */

module.exports.createToken = function(_id) {
    // jwt.sign는 콜백 함수를 전달하지 않으면 synchronous (return token String),
    // 전달하면 asynchronous(return Promise) => 이때 error는 콜백함수로 전달
    return jwt.sign(
        {
            _id: _id
        },
        key,
        {
            expiresIn: expiredInterval,
            issuer: 'K-Aco'
            //subject: '사용자 토큰'
        })
}

module.exports.verifyToken = (req, res, next) => {

    console.log('\x1b[31mVerifying token', new Date(), new Date().getTime())

    const { token } = req.headers

    //req에 토큰 자체가 없는 경우
    if (!token || token === "null") {
        //res.set("verified-token", "")
        console.log("\x1b[30m ..(error 400)", "Bad token(no token)")
        //return res.status(400).json({
        //    status: 400,
        //    msg: "NO_TOKEN"
        //})
        throw new NoTokenError("헤더로 전달된 토큰 없음")
    }

    res.set("verified-token", token) //bad token 이라도 응답하는 이유는 front 에서 기존 token 을 logging 할 필요 있음

    /*
     * <토큰 검사>
     *  3개의 에러를 던진다.
     *   - TokenExpiredError: 토큰 기간 경과
     *      afar 앱 사용시, 여기에 해당되는 경우는 아래와 같음.
     *      jwt 는 만료 시각을 정할 때, 초단위로 확정
     *      즉, 10.891 초에 토큰을 생성하면
     *      토큰은 14.891이 아닌 14.000에 만료됨.
     *      따라서 14.000 이후에 verify 수행하면
     *      'TokenExpiredError'가 발생하게 됨.
     *      다만, 여기 코드에서는 아래와 같이 적용됨.
     *      14.000~14.891 사이에 verify 를 수행하는 경우
     *      'TokenExpiredError'가 발생하여 419를 응답하고,
     *      14.891 이후 verify 를 요청 할 경우는
     *      이미 front 의 쿠키가 삭제되어, headers 에 쿠키를
     *      포함시키지 못한채 요청이 전송되므로,
     *      라인 30에서 status 400 에러가 응답되고 종료됨
     *      따라서 419 응답하는 경우, 즉 여기 if 문에 해당하는
     *      경우는 1초 이내 극히 예외적이며 일반적으로 400 응답을
     *      주로 보낼 것임
     *   - JsonWebTokenError: 그 밖의 검사 에러(키가 안맞거나.. 등등 해당 문서 참고)
     *   - NotBeforeError: JWT가 비활성화 상태인 경우
     *
     */

    // jwt.verify는 콜백 함수를 전달하지 않으면 synchronous (return token String),
    // 전달하면 asynchronous(return Promise) => 이때 error는 콜백함수로 전달
    const { _id, exp } = jwt.verify(token, key)

    req._id = _id

    // '(3)updateInterval'에 해당하는 경우: 토큰 재발급
    if (moment(new Date().getTime()) > moment(exp * 1000).add(updateIntervalNumber, intervalUnit)) {
        const newToken = module.exports.createToken(_id)
        res.set('verified-token', newToken)
        console.log("\x1b[33m ..(regen)", new Date(), new Date().getTime())
        return next()
    }

    // '(2)기간'에 해당하는 경우
    console.log("\x1b[34m ..(OK)", new Date(), new Date().getTime())
    return next()

}

module.exports.encryptJumin = (req, res, next) => {

    try {
        const iv = crypto.randomBytes(16)
        const key = crypto.scryptSync(req.user.jumin3, req.user.salt, 24)
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
        let encrypted = cipher.update(req.jumin3)
        encrypted = Buffer.concat([encrypted, cipher.final()])

        req.encryptedJumin3 = iv.toString('hex') + ':' + encrypted.toString('hex')

        console.log(req.encryptedJumin3)

        // let textParts = req.user.encryptedJumin3.split(':')
        // let iv2 = Buffer.from(textParts.shift(), 'hex')
        // let encryptedText = Buffer.from(textParts.join(':'), 'hex')
        // let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv2)
        // let decrypted = decipher.update(encryptedText)
        //
        // decrypted = Buffer.concat([decrypted, decipher.final()])
        //
        // console.log(decrypted.toString())

    } catch(e) {
        console.log(e)
    }

    return next()

}