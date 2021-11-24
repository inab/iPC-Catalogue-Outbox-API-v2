import { UserFiles } from '../../models/userFiles';
import app from '../../index';
import request from 'supertest';
import tokenRequester from 'keycloak-request-token';
import { usrSettings } from '../../config';

describe('Integration tests: AuthN/Z', () => {

    let usrToken;
    let baseUrl;

    let validOutboxDoc = {
        _id: "https://test-url/TF002",
        metadata: {
            es_index: "nm_gse",
            file_locator: "https://test-url/TF002",
            analysis: "vre"
        }
    };

    const query = async (token) => {
        return await request(app).post("/v1/metadata/")
                                 .auth(token, { type: 'bearer' })
                                 .send(validOutboxDoc)
    }

    beforeEach(async() => {
        baseUrl = process.env.KEYCLOAK_URL;
        usrToken = await tokenRequester(baseUrl, usrSettings);
    });

    afterEach(async () => { 
        app.server.close();
        await UserFiles.remove({});
    });
    
    describe('POST /v1/metadata: Test protected endpoint', () => {
        it('User not Authenticated (302) is not able to POST a valid document', async () => {
            const response = await query("usrToken");
            expect(response.status).toBe(302);
        });

        it('User Authenticated is able to POST a valid document -> 200 ', async () => {
            const response = await query(usrToken);
            expect(response.status).toBe(200);
        });
    })
});

