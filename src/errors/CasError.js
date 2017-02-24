/**
 * TODO
 * @class
 */
class CasError extends Error {

    /**
     * @constructor
     * @param {string} message - Description of the error.
     */
    constructor(message) {

        super(message);
        this.name = this.constructor.name;
        /*if (typeof Error.captureStackTrace === 'function') {
          Error.captureStackTrace(this, this.constructor);
        } else { 
          this.stack = (new Error(message)).stack; 
        }*/
    }
}

export default CasError;
