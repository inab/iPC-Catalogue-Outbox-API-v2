import app from '../../index';
import request from 'supertest';
import tokenRequester from 'keycloak-request-token';
import { usrSettings } from '../../config';

describe('Integration tests: Tokens', () => {

    afterAll(async () => { 
        app.server.close();
    });
    
    describe('Keycloak token generation tests', () => {
        it('Check if user can get an access token from Keycloak', async () => {
            
            let baseUrl = process.env.KEYCLOAK_URL;
            let response;
    
            await tokenRequester(baseUrl, usrSettings).then((token) => {
                    response = token;
                }).catch((err) => {
                    response = err;
            });
            
            expect(response.error).toBe(undefined);
        });
    });

});
