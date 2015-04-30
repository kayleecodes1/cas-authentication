# Node.js CAS Authentication

This is a CAS authentication library designed to be used as middleware for an Express server.

## Installation

    npm install cas-authentication

## Options

### Required

  - `cas_url` The URL of the CAS server.
  - `service_url` The URL of the application which is registered with the CAS server as a valid service.

### Optional

  - `cas_version` The CAS version ('1.0', '2.0', or '3.0'). Default is '1.0'.
  - `renew` If true, single sign-on will be bypassed. Default is false.
  - `gateway` If true, CAS will not ask the client for credentials. Default is false.
  - `is_dev_mode` If true, no CAS authentication will be used and the session CAS user will be set to whatever user is specified as `dev_mode_user`. Default is false.
  - `dev_mode_user` The CAS user to use if dev mode is active. Default is ''.
  - `session_name` The name of the session variable that will store the CAS user. Default is 'cas_user'.
  - `destroy_session` If true, the logout function will destroy the entire session upon CAS logout. Otherwise, it will only delete the session variable storing the CAS user. Default is false.

## Request Handlers

Each instance of CASAuthentication will provide three Express route handlers, as described below.

### bounce

This handler serves two purposes.

It can be put in front of any route as middleware and it will redirect an unauthenticated user to the CAS login and then back to the page they requested once they are authenticated.

It can also be a route in and of itself. If a bounce route is provided with a `returnTo` query parameter (URL encoded), it will save that parameter in the client's session and redirect there once authentication is complete.

### block

This handler can be put in front of any route as middleware and works the same as `bounce`. The difference is that if the user is not already authenticated with CAS they will not be directed to the CAS login but will instead receive a 401 Unauthorized response.

A use case for this handler would be to put it in front of API routes so that the API request is delivered a meaningful error code rather than the HTML body of the CAS login page.

### logout

This handler is a route in and of itself. It will de-authenticate the CAS user with the Express server (either by deleting the session variable or the entire session) and redirect to the CAS logout.

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

// Set up basic CASAuthentication.
var cas = new CASAuthentication({
    cas_url     : 'https://my-cas-host.com/cas',
    service_url : 'https://my-service-host.com'
});

// TODO: comment
app.get( '/app', cas.bounce, function ( req, res ) {
    // render application
});

// TODO: comment
app.get( '/bounce', cas.bounce );

// TODO: comment
app.get( '/api', cas.block, function ( req, res ) {
    res.json( { success: true } );
});

// TODO: comment
app.get( '/logout', cas.logout );
```

## Additional Notes

//TODO: req.session['cas_user'] is available