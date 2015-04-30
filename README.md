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

### Simple

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
app.get( '/app', cas.bounce, function ( req, res ) {} );

// TODO: comment
app.get( '/bounce', cas.bounce, function ( req, res ) {} );

// TODO: comment
app.get( '/api', cas.block, function ( req, res ) {
    res.json( '' );
});

// TODO: comment
app.get( '/logout', cas.logout );
```