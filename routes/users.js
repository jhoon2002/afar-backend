let express = require('express')
let mongoose = require('mongoose')
let router = express.Router()
let User = require("../models/user.js")
const crypto = require('crypto')

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
    const user = await User.findOne({ user_id: userId }, [ "salt", "password"]).exec()
    if (!user) return false
    const password = await makePasswordHashed(plainPassword, user.salt)
    if (password === user.password) return true
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

router.post('/check', function (req, res) {
    // console.log(req.body, req.query)
    check(req.body.userId, req.body.password)
        .then(ret => res.send(ret))
        .catch(console.log)
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
