import url from 'url';

/**
 * Redirects the client to the CAS login.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
function login(req, res) {

    // Save the return URL in the session. If an explicit return URL is set as a
    // query parameter, use that. Otherwise, just use the URL from the request.
    req.session.cas_return_to = req.query.returnTo || url.parse(req.originalUrl).path;

    // Set up the query parameters.
    const query = {
        service: this.service_url + url.parse(req.originalUrl).pathname
    };

    // Only add renew to the query string if it is true.
    if (this.renew) {
        query.renew = this.renew;
    }

    // Redirect to the CAS login.
    res.redirect(this.cas_url + url.format({
        pathname: '/login',
        query: query
    }));
}

export default login;
