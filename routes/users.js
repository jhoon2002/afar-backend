let express = require('express')
let mongoose = require('mongoose')
let router = express.Router()
let User = require("../models/user.js")
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

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

async function check(userId, plainPassword) {
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

router.post('/login', function (req, res) {
    // console.log(req.body, req.query)

    const userId = req.body.userId
    const password = req.body.password
    const jwtSecret = "secret"

    check(userId, password)
        .then(ret => {
            if (ret) { //if api(check) returns user
                //토큰 발급
                const getToken = new Promise((resolve, reject) => {
                    jwt.sign(
                        {
                            id: userId,
                            // role: User.user_role
                        },
                        jwtSecret,
                        {
                            expiresIn: '7d',
                            issuer: 'K-Aco',
                            subject: 'User authorization'
                        },
                        (err, token) => {
                            if (err) reject(err)
                            resolve(token)
                        })
                })

                getToken.then(token => {
                        res.status(200).json({
                            "status": 200,
                            "msg": 'Login success',
                            "user": ret,
                            token
                        })
                    }
                )
            } else {
                res.status(403).json({
                    'status': 403,
                    'msg': 'Login fail'
                })
            }

        })
        .catch(console.log)
})

router.post('/refresh-token', (req, res) => {
    return res.status(200).json({
        'token': 'new_token',
        'status': 200
    })
})

router.get('/check-token', (req, res) => {
    // 인증 확인
    const token = req.headers['token'] // || req.query.token
    let jwtSecret = 'secret'

    if (!token || token === "null") {
        res.status(400).json({
            'status': 400,
            'msg': 'Token 없음'
        })
        return
    }
    const checkToken = new Promise((resolve, reject) => {
        jwt.verify(token, jwtSecret, function (err, decoded) {
            if (err) reject(err)
            resolve(decoded)
        })
    })

    checkToken.then(
        token => {
            console.log(token)
            //todo: 만료시간 연장 로직
            res.status(200).json({
                'status': 200,
                'msg': 'success',
                token
            })
        }
    ).catch(console.log)
})

/* 테스트용
router.get('/check-test', function (req, res) {
    check(req.query.userId, req.query.password)
        .then(ret => res.send(ret))
        .catch(console.log)
})
*/

/* 솔트와 패스워드 발급기
router.get('/get-password', function (req, res) {
    // console.log(req.query, req.params)
    getPassword(req.query.password).then(ret => res.send(ret))
})
*/

module.exports = router
