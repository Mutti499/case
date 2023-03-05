class ExpressError extends Error{
    constructor(message, code){
        super();
        this.message = message;
        this.statusCode = code;
    }
}

module.exports = ExpressError;