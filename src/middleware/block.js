/**
 * Blocks a request.
 *
 * If the user's session is not validated with CAS, they will receive a 401
 * Unauthorized response.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
function block(req, res, next) {

    // If the user is authenticated, pass to the next middleware.
    if (this.isAuthenticated(req)) {
        next();
        return;
    }

    // Otherwise, send a 401 Unauthorized response.
    res.sendStatus(401);
}

export default block;
