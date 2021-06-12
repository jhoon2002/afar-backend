// 검색 결과가 없는 경우(예외를 발생시킬 필요가 있을 때문 사용)
class NoDataError extends Error {
    constructor(message) {
        super(message)
        this.name = "NoDataError"
    }
}

// 일반 에러: response 400
class PlainError extends Error {
    constructor(message) {
        super(message)
        this.name = "PlainError"
    }
}

module.exports = {
    NoDataError: NoDataError,
    PlainError: PlainError
}