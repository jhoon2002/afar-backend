class NoDataError extends Error {
    constructor(message) {
        super(message)
        this.name = "NoDataError"
    }
}
class TokenError extends Error {
    constructor(message) {
        super(message)
        this.name = "TokenError"
    }
}
module.exports = {
    NoDataError: NoDataError,
    TokenError: TokenError
}