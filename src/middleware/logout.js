/**
 * Redirects the client to the CAS logout.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
function logout(req, res) {

    // Destroy the entire session if the option is set.
    if (this.destroy_session) {
        req.session.destroy((err) => {
            if (err) {
                //console.log(err);
                //TODO: what to do here?
            }
        });
    }
    // Otherwise, just destroy the CAS-specific session variables.
    else {
        delete req.session[this.session_name];
        if (this.session_info && req.session.hasOwnProperty(this.session_info)) {
            delete req.session[this.session_info];
        }
    }

    // Redirect the client to the CAS logout.
    res.redirect(`${this.cas_url}/logout`);
}

export default logout;
