/**
* Bounces and then redirects a request.
*
* If the user's session is not validated with CAS, their request will be
* redirected to the CAS login page.
* 
* If the user's session is validated with CAS, they will be redirected.

TODO: explain where they are redirected

*
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
function bounce_redirect(req, res) {

    // If the user is authenticated, redirect them.
    if (this.isAuthenticated(req)) {
        res.redirect(req.session.cas_return_to);
        return;
    }

    // If there is a ticket that needs to be validated, do nothing.
    if (this.tryHandleTicket(req, res)) {
        return;
    }

    // Otherwise, redirect the user to the login.
    this.login(req, res);
}

export default bounce_redirect;
