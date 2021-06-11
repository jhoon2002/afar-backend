const crypto = require('crypto')

module.exports.toPayload = function(queryStringObj) {

    let qso = queryStringObj

    //filter: Obj
    let filter = qso.filt ? qso.filt : {}

    //searcher: Array
    let searcher = []
    let io = qso.search
    for (let key in io) {
        if (io[key]) {
            let obj = {}
            obj[key] = new RegExp(io[key], 'i')
            searcher.push(obj)
        }
    }

    //sorter: Obj
    let sorter = {}
    let fields = qso.sort.fields
    let descs = qso.sort.descs
    if (fields) {
        for (let [index, field] of fields.entries()) {
            sorter[field] = descs[index] === "true" ? -1 : 1
        }
    }

    //pager: Obj
    let pager = {
        skip: (qso.paging.page - 1) * qso.paging.limit,
        limit: qso.paging.limit
    }

    return { //payload
        filter: filter,
        searcher: searcher,
        sorter: sorter,
        pager: pager,
        and: qso.and
    }

}

module.exports.getFileExt = function(filename) {
    return filename.substring(filename.lastIndexOf('.') + 1, filename.length)
}

/*
 * async 내에서 예외가 발생하는 경우 async 내에서 자체 예외 처리를 하는 경우는 상관이 없겠으나,
 * app.js 에서 예외 관리를 통합적으로 하기 위하여 async 내에서 따로 예외 처리를 안하는 경우,
 * 반드시 아래 함수로, 콜백 함수를 래핑해야 함.
 * 만약 래핑하지 않은 상태에서 예외가 발생하면, 애플리케이션(Express)이 종료될 수 있음.
 * Express는 sync 내에서 발생한 예외만 처리가 가능함.
 */
module.exports.wrapAsync = function(fn) {
    return function (req, res, next) {
        // 모든 오류를 .catch() 처리하고 체인의 next() 미들웨어에 전달하세요
        // (이 경우에는 오류 처리기)
        fn(req, res, next).catch(next)
    }
}

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

module.exports.createSalt = function() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (err) reject(err)
            resolve(buf.toString('base64'))
        })
    })
}

/*module.exports.createHashedPassword = function(plainPassword) {
    return new Promise(async (resolve, reject) => {
        const salt = await createSalt()
        crypto.pbkdf2(plainPassword, salt, 9999, 64, 'sha512', (err, key) => {
            if (err) reject(err)
            resolve({password: key.toString('base64'), salt});
        })
    })
}*/

module.exports.makePasswordHashed = function(plainPassword, salt) {
    return new Promise(async (resolve, reject) => {
        crypto.pbkdf2(plainPassword, salt, 9999, 64, 'sha512', (err, key) => {
            if (err) reject(err);
            resolve(key.toString('base64'));
        })
    })
}

module.exports.undirectEncrypt = function (target, salt) {

}

// 양방향 암호화
module.exports.bidirectEncrypt = function (target, salt) {

    const iv = crypto.randomBytes(16)

    //console.log("req.query.j:", req.query.j, "salt:", salt)
    const encryptKey = crypto.scryptSync(encryptPassword, salt, 24)

    //console.log("encryptKey", encryptKey)

    const cipher = crypto.createCipheriv('aes-192-cbc', encryptKey, iv)
    let encrypted = cipher.update(req.query.j)
    encrypted = Buffer.concat([encrypted, cipher.final()])

    req.jumin3Encrypted = iv.toString('hex') + ':' + encrypted.toString('hex')

    //console.log("req.jumin3Encrypted(최종):", req.jumin3Encrypted)
}
