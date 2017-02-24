/**
* Bounces a request.
*
* If the user's session is not validated with CAS, their request will be
* redirected to the CAS login page.
*
* @private
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
* @param {Function} next - Express next middleware function.
*/

function bounce(req, res, next) {

    // If the user is authenticated, pass to the next middleware.
    if (this.isAuthenticated(req)) {
        next();
        return;
    }

    // If there is a ticket that needs to be validated, do nothing.
    if (this.tryHandleTicket(req, res)) {
        return;
    }

    // Otherwise, redirect the user to the CAS login.
    this.login(req, res);
}

export default bounce;
