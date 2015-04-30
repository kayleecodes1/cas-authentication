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

// If the user is not authenticated yet, redirect them to the CAS login. It will
// redirect back to "/app" once they are authenticated and they will be allowed
// through.
app.get( '/app', cas.bounce, function ( req, res ) {
    // Can access req.session['cas_user'] here.
});

// This route requires a "redirectTo" query parameter (i.e.
// "/bounce?returnTo=<url-encoded-path>"). It will do the same as the "/app"
// route but instead of redirecting back to "/bounce", they will be redirected
// to the supplied "redirectTo" parameter.
app.get( '/bounce', cas.bounce );

// If an unauthenticated user visits this route, they will simply receive a 401
// Unauthorized response. They will not be redirected to a login. If they are
// already authenticated, they will be allowed through.
app.get( '/api', cas.block, function ( req, res ) {
    res.json( { success: true } );
});

// An example of accessing the CAS user session variable. This could be used to
// retrieve your own local user records based on authenticated CAS username.
app.get( '/api/user', cas.block, function ( req, res ) {
    res.json( { cas_user: req.session['cas_user'] } );
});

// This route will de-authenticate the user with the Express server (either by
// deleting the session variable or the entire session) and redirect the user
// to the CAS logout page.
app.get( '/logout', cas.logout );
```