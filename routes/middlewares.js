const jwt = require('jsonwebtoken')
const moment = require("moment")

const key = "U-Koz56^--Yui"
const intervalNumber = "60"
const updateIntervalNumber = "-30"
const intervalUnit = "m"
const expiredInterval = intervalNumber + intervalUnit
//const updateInterval = updateIntervalNumber + intervalUnit

/*
jwt 시간단위가 vue-cookies와 다름에 유의

<jwt>
시간(h), 분(m), 일(days/d(?))

<vue-cookies>
시간(h), 분(min), 초(s), 월(m)
 */

module.exports.createToken = async function(_id) {
    return await jwt.sign(
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

module.exports.verifyToken = async (req, res, next) => {

    console.log('\x1b[31mVerifying token', new Date(), new Date().getTime())

    const { token } = req.headers

    //req에 토큰 자체가 없는 경우
    if (!token || token === "null") {
        res.set("verified-token", "")
        console.log("\x1b[30m ..(error 400)", "Bad token(no token)")
        return res.status(400).json({
            status: 400,
            msg: "NO_TOKEN"
        })
    }

    try {
        const { _id, exp } = await jwt.verify(token, key)
        //토큰 갱신

        req._id = _id
        if (moment(new Date().getTime()) > moment(exp * 1000).add(updateIntervalNumber, intervalUnit)) {
            const newToken = await module.exports.createToken(_id)
            res.set('verified-token', newToken)
            console.log("\x1b[33m ..(regen)", new Date(), new Date().getTime())
            return next()
        }
        res.set('verified-token', token) //이 셋팅이' 없으면 매번 headers에 token을 보냄. 정확한 원인은 파악 안됨.
        console.log("\x1b[34m ..(OK)", new Date(), new Date().getTime())
        return next()

    } catch (e) {

        console.log("\x1b[30m ..(error 419 401)", "Token was deleted(expired, bad key, etc..)", e)

        res.set("verified-token", token) //bad token 이라도 응답하는 이유는 front 에서 기존 token 을 logging 할 필요 있음

        if (e.name === 'TokenExpiredError') {

            /*
             * 여기에 해당되는 경우는 아래와 같음.
             * jwt 는 만료 시각을 정할 때, 초단위로 확정
             * 즉, 10.891 초에 토큰을 생성하면
             * 토큰은 14.891이 아닌 14.000에 만료됨.
             * 따라서 14.000 이후에 verify 수행하면 
             * 'TokenExpiredError'가 발생하게 됨.
             * 다만, 여기 코드에서는 아래와 같이 적용됨.
             * 14.000~14.891 사이에 verify 를 수행하는 경우
             * 'TokenExpiredError'가 발생하여 419를 응답하고, 
             * 14.891 이후 verify 를 요청 할 경우는
             * 이미 front 의 쿠키가 삭제되어, headers 에 쿠키를
             * 포함시키지 못한채 요청이 전송되므로, 
             * 라인 30에서 status 400 에러가 응답되고 종료됨
             * 따라서 419 응답하는 경우, 즉 여기 if 문에 해당하는
             * 경우는 1초 이내 극히 예외적이며 일반적으로 400 응답을 
             * 주로 보낼 것임
             */

            return res.status(419).json({
                status: 419,
                msg: 'EXPIRED_TOKEN'
            })
        }

        // 그 밖의 모든 경우, 주로 토큰의 비밀키가 일치하지 않는 경우
        return res.status(401).json({
            status: 401,
            msg: 'INVALID_TOKEN'
        });
    }
}