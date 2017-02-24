# cas-authentication

A CAS authentication library that provides
[Connect](http://www.senchalabs.org/connect/)-style middleware, designed to be used with
[Express](http://expressjs.com/) servers.

This module has a dependency on [express-session](https://github.com/expressjs/session).

## Installation

```sh
npm install --save cas-authentication
```

## CAS Support and References

The following CAS versions are supported:

- CAS 1.0 [(Specification)](https://apereo.github.io/cas/5.0.x/protocol/CAS-Protocol-Specification.html)
- CAS 2.0 [(Specification)](https://apereo.github.io/cas/5.0.x/protocol/CAS-Protocol-V2-Specification.html)
- CAS 3.0 [(Specification)](https://apereo.github.io/cas/5.0.x/protocol/CAS-Protocol-Specification.html)
- SAML 1.1 [(Specification)](https://apereo.github.io/cas/5.0.x/protocol/SAML-Protocol.html)

## Configuration

This library provides a class that can be instantiated with a configuration object, as shown below.

```javascript
const CasAuthentication = require('cas-authentication');

const cas = new CasAuthentication({
    cas_url: 'https://my-cas-host.com/cas',
    service_url: 'https://my-service-host.com',
    cas_version: '3.0'
});
```

A CasAuthentication instance exposes five middleware functions:

- `bounce`: Redirects an unauthenticated client to the CAS login page and then back to the requested page.
- `block`: Completely denies access to an unauthenticated client and returns a 401 response.
- `bounce_redirect`: Acts just like `bounce` but once the client is authenticated they will be redirected to the provided _returnTo_ query parameter.
- `login`: Redirects the client to the CAS login page.
- `logout`: De-authenticates the client with the Express server and then redirects them to the CAS logout page.

### Options

| Name | Type | Description | Default |
|:-----|:----:|:------------|:-------:|
| cas_url | _string_ | The URL of the CAS server. | _(required)_ |
| service_url | _string_ | The URL of the application which is registered with the CAS server as a valid service. | _(required)_ |
| cas_version | _"1.0"\|"2.0\|"3.0"\|"saml1.1"_ | The CAS protocol version. | _"3.0"_ |
| renew | _boolean_ | If true, an unauthenticated client will be required to login to the CAS system regardless of whether a single sign-on session exists. | _false_ |
| is_dev_mode | _boolean_ | If true, no CAS authentication will be used and the session CAS variable will be set to whatever user is specified as _dev_mode_user_. | _false_ |
| dev_mode_user | _string_ | The CAS user to use if dev mode is active. | _""_ |
| dev_mode_info | _Object_ | The CAS user information to use if dev mode is active. | _{}_ |
| session_name | _string_ | The name of the session variable that will store the CAS user once they are authenticated. | _"cas_user"_ |
| session_info | _string_ | The name of the session variable that will store the CAS user information once they are authenticated. If set to false (or something that evaluates as false), the additional information supplied by the CAS will not be forwarded. This will not work with CAS 1.0, as it does not support additional user information. | _false_ |
| destroy_session | _boolean_ | If true, the logout function will destroy the entire session upon CAS logout. Otherwise, it will only delete the session variable storing the CAS user. | _false_ |
| additional_request_options | _Object_ | Any additional request options to be added to the HTTP request that is sent to the CAS server. | _{}_ |

## Usage

```javascript
const app = require('express')();
const session = require('express-session');
const CasAuthentication = require('cas-authentication');

// Set up an Express session, which is required for CASAuthentication.
app.use(session({
    secret: 'super secret key',
    resave: false,
    saveUninitialized: true
}));

// Create a new instance of CASAuthentication.
const cas = new CasAuthentication({
    cas_url: 'https://my-cas-host.com/cas',
    service_url: 'https://my-service-host.com',
    cas_version: '3.0'
});

// Unauthenticated clients will be redirected to the CAS login and then back to
// this route once authenticated.
app.get('/app', cas.bounce, (req, res) => {
    res.send( '<html><body>Hello!</body></html>' );
});

// Unauthenticated clients will receive a 401 Unauthorized response instead of
// the JSON data.
app.get('/api', cas.block, (req, res) => {
    res.json({ success: true });
});

// An example of accessing the CAS user session variables. This could be used
// to retrieve your own local user records based on authenticated CAS username
// or attributes.
app.get('/api/user', cas.block, (req, res) => {
    res.json({
        cas_user: cas.getCasUser(req),
        cas_userinfo: cas.getCasUserInfo(req)
    });
});

// Unauthenticated clients will be redirected to the CAS login and then to the
// provided "redirectTo" query parameter once authenticated.
app.get('/authenticate', cas.bounce_redirect);

// This route will redirect the client to the CAS login page.
app.get('/logout', cas.login);

// This route will de-authenticate the client with the Express server and then
// redirect the client to the CAS logout page.
app.get('/logout', cas.logout);
```
