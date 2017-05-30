module.exports.generate = function (error,status,data,message) {
    response =
        {
            error : error,
            status: status,
            data : data,
            message : message
        };
    return response;
};