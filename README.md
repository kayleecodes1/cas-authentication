# Express CAS Authentication

This is a CAS authentication library designed to be used with an Express server.

It provides two middleware functions for controlling access to routes:

- `bounce`: Redirects an unauthenticated client to the CAS login page and then back to the requested page.
- `block`: Completely denies access to an unauthenticated client and returns a 401 response.

It also provides two route endpoint functions:

- `bounce_redirect`: Acts just like `bounce` but once the client is authenticated they will be redirected to the provided _returnTo_ query parameter.
- `logout`: De-authenticates the client with the Express server and then redirects them to the CAS logout page.

## Installation

    npm install cas-authentication

## Setup

```javascript
var CASAuthentication = require('cas-authentication');

var cas = new CASAuthentication({
    cas_url         : 'https://my-cas-host.com/cas',
    service_url     : 'https://my-service-host.com',
    cas_version     : '3.0',
    renew           : false,
    is_dev_mode     : false,
    dev_mode_user   : '',
    dev_mode_info   : {},
    session_name    : 'cas_user',
    session_info    : 'cas_userinfo',
    destroy_session : false
});
```

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

## Usage

```javascript
var app = require('express')();
var session = require('express-session');
var CASAuthentication = require('cas-authentication');

// Set up an Express session, which is required for CASAuthentication.
app.use( session({
    secret            : 'super secret key',
    resave            : false,
    saveUninitialized : true
}));

// Create a new instance of CASAuthentication.
var cas = new CASAuthentication({
    cas_url     : 'https://my-cas-host.com/cas',
    service_url : 'https://my-service-host.com'
});

// Unauthenticated clients will be redirected to the CAS login and then back to
// this route once authenticated.
app.get( '/app', cas.bounce, function ( req, res ) {
    res.send( '<html><body>Hello!</body></html>' );
});

// Unauthenticated clients will receive a 401 Unauthorized response instead of
// the JSON data.
app.get( '/api', cas.block, function ( req, res ) {
    res.json( { success: true } );
});

// An example of accessing the CAS user session variable. This could be used to
// retrieve your own local user records based on authenticated CAS username.
app.get( '/api/user', cas.block, function ( req, res ) {
    res.json( { cas_user: req.session[ cas.session_name ] } );
});

// Unauthenticated clients will be redirected to the CAS login and then to the
// provided "redirectTo" query parameter once authenticated.
app.get( '/authenticate', cas.bounce_redirect );

// This route will de-authenticate the client with the Express server and then
// redirect the client to the CAS logout page.
app.get( '/logout', cas.logout );
```