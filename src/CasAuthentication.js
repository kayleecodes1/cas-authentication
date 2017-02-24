import 'babel-polyfill';

import url from 'url';
import urlJoin from 'url-join';
import http from 'http';
import https from 'https';

import CasError from './errors/CasError';
import CasResponseError from './errors/CasResponseError';
import CasAuthenticationError from './errors/CasAuthenticationError';

import parseTextResponse from './parsing/parseTextResponse';
import parseXmlResponse from './parsing/parseXmlResponse';
import parseSamlResponse from './parsing/parseSamlResponse';

import block from './middleware/block';
import bounce from './middleware/bounce';
import bounce_redirect from './middleware/bounce_redirect';
import login from './middleware/login';
import logout from './middleware/logout';

/**
 * @typedef {Object} CasConfiguration
 * @property {string} cas_url
 * @property {string} service_url
 * @property {('1.0'|'2.0'|'3.0'|'saml1.1')} [cas_version='3.0']
 * @property {boolean} [renew=false]
 * @property {boolean} [is_dev_mode=false]
 * @property {?string} [dev_mode_user=null]
 * @property {?Object} [dev_mode_info=null]
 * @property {string} [session_name='cas_user']
 * @property {string} [session_info='cas_userinfo']
 * @property {boolean} [destroy_session=false]
 * @property {Object} [additional_request_options={}]
 */

 /**
 * @typedef {Object} RequestConfiguration
 * @property {Object} options - The options object for the request.
 * @property {?string} body - The optional body for the request.
 */

 /**
 * @typedef {Object} CasUserData
 * @property {string} user - The string representing the CAS user's identity.
 * @property {?Object} attributes - The optional object containing attributes of the CAS user.
 */

 const VALIDATE_ENDPOINT = {
    '1.0': '/validate',
    '2.0': '/serviceValidate',
    '3.0': '/p3/serviceValidate',
    'saml1.1': '/samlValidate'
 };

/**
 * @class
 */
class CasAuthentication {

    /**
     * @constructor
     * @param {CasConfiguration} config
     */
    constructor({
        cas_url,
        service_url,
        cas_version = '3.0',
        renew = false,
        is_dev_mode = false,
        dev_mode_user = null,
        dev_mode_info = null,
        session_name = 'cas_user',
        session_info = 'cas_userinfo',
        destroy_session = false,
        additional_request_options = {}
    } = {}) {

        if (!cas_url) {
            throw new CasError('No `cas_url` was provided. It is required.');
        }
        this.cas_url = cas_url;
        if (!service_url) {
            throw new CasError('No `service_url` was provided. It is required.');
        }
        this.service_url = service_url;
        if (!(/^1\.0|2\.0|3\.0|saml1\.1$/.test(cas_version))) {
            throw new CasError(`An invalid \`cas_version\` was provided ("${cas_version}").`);
        }
        this.cas_version = cas_version;
        this.renew = renew;
        if (is_dev_mode && !dev_mode_user) {
            throw new CasError('No \`dev_mode_user\` was provided. It is required when `is_dev_mode` is true.');
        }
        this.is_dev_mode = is_dev_mode;
        this.dev_mode_user = dev_mode_user;
        this.dev_mode_info = dev_mode_info;
        this.session_name = session_name;
        this.session_info = session_info;
        this.destroy_session = destroy_session;
        this.additional_request_options = additional_request_options;

        const parsed_cas_url = url.parse(this.cas_url);
        this.cas_protocol = parsed_cas_url.protocol;
        this.cas_host = parsed_cas_url.hostname;
        this.cas_port = parsed_cas_url.port || (parsed_cas_url.protocol === 'http:' ? 80 : 443);
        this.cas_path = parsed_cas_url.pathname;

        this.block = block.bind(this);
        this.bounce = bounce.bind(this);
        this.bounce_redirect = bounce_redirect.bind(this);
        this.login = login.bind(this);
        this.logout = logout.bind(this);
    }

    /**
     * If the user associated with the given request is authenticated, returns
     * the string representing their CAS user. Otherwise returns null.
     *
     * @param {Object} req - Express request object.
     * @returns {?string}
     */
    getCasUser(req) {

        if (this.isAuthenticated(req)) {
            return req.session[this.session_name];
        }

        return null;
    }

    /**
     * If the user associated with the given request is authenticated, returns
     * the user's stored CAS attributes. Otherwise returns null.
     *
     * @param {Object} req - Express request object.
     * @returns {?Object}
     */
    getCasUserInfo(req) {

        if (this.isAuthenticated(req)) {
            return req.session[this.session_info];
        }

        return null;
    }

    /**
     * Checks if the user associated with the given request and returns true if
     * so. Otherwise returns false.
     * 
     * @private
     * @param {Object} req - Express request object.
     * @returns {boolean} - Indicates if the user is authenticated.
     */
    isAuthenticated(req) {

        if (this.is_dev_mode) {
            req.session[this.session_name] = this.dev_mode_user;
            req.session[this.session_info] = this.dev_mode_info || {};
            return true;
        }

        if (req.session[this.session_name]) {
            return true;
        }

        return false;
    }

    /**
     * Attempts to handle a ticket for the given request and response. If there
     * is a ticket in the request query string, the ticket is handled and the
     * method returns true. Otherwise returns false.
     * 
     * @private
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @returns {boolean} - Indicates if a ticket is being handled.
     */
    tryHandleTicket(req, res) {

        if (req.query && req.query.ticket) {
            this.handleTicket(req, res);
            return true;
        }

        return false;
    }

    /**
     * Builds the configuration for the CAS validation request.
     *
     * @param {string} requestHost - The request hostname.
     * @param {string} requestPath - The request pathname.
     * @param {string} ticket - The validation ticket.
     * @returns {RequestConfiguration}
     */
    buildValidateRequest(requestHost, requestPath, ticket) {

        const options = {};
        let body = null;

        Object.assign(options, this.additional_request_options);
        options.host = this.cas_host;
        options.port = this.cas_port;

        const pathname = urlJoin(this.cas_path, VALIDATE_ENDPOINT[this.cas_version]);
        const service = this.service_url + url.parse(requestPath).pathname;

        if (this.cas_version !== 'saml1.1') {
            options.method = 'GET';
            options.path = url.format({ pathname, query: { service, ticket } });
        }
        else {
            options.method = 'POST';
            options.path = url.format({ pathname, query: { TARGET: service, ticket: '' } });
            const date = new Date();
            body =
                `<?xml version="1.0" encoding="utf-8"?>\n` +
                `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">\n` +
                `  <SOAP-ENV:Header/>\n` +
                `  <SOAP-ENV:Body>\n` +
                `    <samlp:Request xmlns:samlp="urn:oasis:names:tc:SAML:1.0:protocol" MajorVersion="1"\n` +
                `      MinorVersion="1" RequestID="_${requestHost}.${date.getTime()}"\n` +
                `      IssueInstant="${date.toISOString()}">\n` +
                `      <samlp:AssertionArtifact>\n` +
                `        ${ticket}\n` +
                `      </samlp:AssertionArtifact>\n` +
                `    </samlp:Request>\n` +
                `  </SOAP-ENV:Body>\n` +
                `</SOAP-ENV:Envelope>`;
            options.headers = {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(body)
            };
        }

        return { options, body };
    }

    /**
     * Sends a CAS validation request using the given configuration object.
     * Returns a Promise that resolves with the response body string from the
     * CAS server.
     *
     * @param {RequestConfiguration} config
     * @returns {Promise}
     */
    sendValidateRequest({ options, body }) {

        const request_client = this.cas_protocol === 'https:' ? https : http;

        return new Promise((resolve, reject) => {
            const request = request_client.request(options, (response) => {
                response.setEncoding('utf8');
                let body = '';
                response.on('data', (chunk) => {
                    body += chunk;
                });
                response.on('end', () => {
                    resolve(body);
                });
            });
            request.on('error', (err) => {
                reject(err);
            });
            if (body) {
                request.write(body);
            }
            request.end();
        });
    }

    /**
     * Parses the given response body string from the CAS server. Returns a
     * Promise that resolves with a @link{CasUserData} object containing the
     * parsed CAS user data.
     *
     * @param {string} body
     * @returns {Promise}
     */
    parseValidateResponse(body) {

        switch (this.cas_version) {
            case '1.0':
                return CasAuthentication.parseTextResponse(body);
            case '2.0':
            case '3.0':
                return CasAuthentication.parseXmlResponse(body);
            case 'saml1.1':
                return CasAuthentication.parseSamlResponse(body);
            default:
                return Promise.reject(new CasError(`Current \`cas_version\` is invalid ("${this.cas_version}"). This property should not be changed.`));
        }
    }

    /**
     * Parses a text response from a CAS server's validation route. Returns a
     * Promise that resolves with a @link{CasUserData} object.
     *
     * @static
     * @private
     * @param {string} body - The body of the CAS server response.
     * @returns {Promise}
     */
    static parseTextResponse(body) {
        return parseTextResponse(body);
    }

    /**
     * Parses an XML response from a CAS server's validation route. Returns a
     * Promise that resolves with a @link{CasUserData} object.
     *
     * @static
     * @private
     * @param {string} body - The body of the CAS server response.
     * @returns {Promise}
     */
    static parseXmlResponse(body) {
        return parseXmlResponse(body);
    }

    /**
     * Parses a SAML response from a CAS server's validation route. Returns a
     * Promise that resolves with a @link{CasUserData} object.
     *
     * @static
     * @private
     * @param {string} body - The body of the CAS server response.
     * @returns {Promise}
     */
    static parseSamlResponse(body) {
        return parseSamlResponse(body);
    }

    /**
     * Handles the ticket generated by the CAS login requester and validates it
     * with the CAS login acceptor.
     *
     * This method should only be called if `req.query.ticket` exists.
     *
     * @private
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @returns {Promise}
     */
    handleTicket(req, res) {

        const { host, originalUrl, query } = req;

        return Promise.resolve()
            .then(() => this.buildValidateRequest(host, originalUrl, query.ticket))
            .then(this.sendValidateRequest)
            .then(this.parseValidateResponse)
            .then(({ user, attributes = {} }) => {
                req.session[this.session_name] = user;
                req.session[this.session_info] = attributes;
                res.redirect(req.session.cas_return_to);
                resolve();
            })
            .catch((err) => {
                if (err.constructor === CasResponseError) {
                    res.sendStatus(502, err.message);
                    return;
                }
                if (err.constructor === CasAuthenticationError) {
                    res.sendStatus(401, err.message);
                    return;
                }
                res.sendStatus(500, err.message);
            });
    }
}

export default CasAuthentication;
