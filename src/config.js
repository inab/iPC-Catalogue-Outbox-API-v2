var session = require('express-session');
var Keycloak = require('keycloak-connect');

require('dotenv').config();

var keycloakConfig = {
    "realm": "IPC",
    "auth-server-url": process.env.KEYCLOAK_URL,
    "ssl-required": "external",
    "resource": "ipc-outbox-api",
    "verify-token-audience": true,
    "public-client": true,
    "credentials": {
        "secret": process.env.KEYCLOAK_OUTBOX_CLIENT_SECRET
    },
    "use-resource-role-mappings": true,
    "confidential-port": 0,
    "policy-enforcer": {}
}

var memoryStore = new session.MemoryStore();
var keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

var sessionData = session({
    secret: Math.random().toString(36).substring(2, 15),
    resave: false,
    saveUninitialized: true,
    store: memoryStore
});

// User (tests): 
const usrSettings = {
    client_id: 'ipc-react-portal',
    username: process.env.REGULAR_USER_NAME,
    password: process.env.REGULAR_USER_PASS,
    grant_type: 'password',
    realmName: 'IPC'
};

var serverConf = {
    "port": 8085,
    "bodyLimit": "100kb",
    "corsHeaders": ["Link"]
};

export { keycloak, sessionData, usrSettings, serverConf };
