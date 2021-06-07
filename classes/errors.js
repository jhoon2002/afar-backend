// 검색 결과가 없는 경우(예외를 발생시킬 필요가 있을 때문 사용)
class NoDataError extends Error {
    constructor(message) {
        super(message)
        this.name = "NoDataError"
    }
}

// 토큰이 front 넘오지 않은 경우
class NoTokenError extends Error {
    constructor(message) {
        super(message)
        this.name = "NoTokenError"
    }
}

module.exports = {
    NoDataError: NoDataError,
    NoTokenError: NoTokenError
}