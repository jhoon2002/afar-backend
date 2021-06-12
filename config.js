// 토큰 key
const TOKEN_KEY = "U-Koz56^--Yui"

// 토큰 발행자
const TOKEN_ISSUER = "K-Aco"

/*
 *
 * 토큰 시간
 * jwt 시간단위가 vue-cookies와 다름에 유의
 *
 * <jwt>
 * 시간(h), 분(m), 일(days/d(?))
 *
 * <vue-cookies>
 * 시간(h), 분(min), 초(s), 월(m)
 *
 */
const TOKEN_INTERVAL = "60"
const TOKEN_UPDATE_INTERVAL = "-30"
const TOKEN_UNIT = "m"
const TOKEN_EXPIRE = TOKEN_INTERVAL + TOKEN_UNIT

// 암호화 password
const ENCRYPT_PASSWORD = "T-hoek^r--%%-wy"


module.exports = {
    TOKEN_KEY: TOKEN_KEY,
    TOKEN_ISSUER: TOKEN_ISSUER,
    TOKEN_INTERVAL: TOKEN_INTERVAL,
    TOKEN_UPDATE_INTERVAL: TOKEN_UPDATE_INTERVAL,
    TOKEN_UNIT: TOKEN_UNIT,
    TOKEN_EXPIRE: TOKEN_EXPIRE,
    ENCRYPT_PASSWORD: ENCRYPT_PASSWORD
}