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

module.exports.wrapAsync = function(fn) {
    return function (req, res, next) {
        // 모든 오류를 .catch() 처리하고 체인의 next() 미들웨어에 전달하세요
        // (이 경우에는 오류 처리기)
        fn(req, res, next).catch(next)
    }
}