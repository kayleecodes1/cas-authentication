import CasError from './CasError';

/**
 * TODO
 * @class
 */
class CasResponseError extends CasError {

    /**
     * @constructor
     * @param {string} message - Description of the error.
     */
    constructor(message) {

        super(message);
        this.name = this.constructor.name;
    }
}

export default CasResponseError;
