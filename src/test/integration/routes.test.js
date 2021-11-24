import { UserFiles } from '../../models/userFiles';
import { FilesMetadata } from '../../models/filesMetadata';
import app from '../../index';
import request from 'supertest';
import tokenRequester from 'keycloak-request-token';
import { usrSettings } from '../../config';
import { postUserPermissions, deleteUserPermissions } from '../../permissions_db';

describe('Integration tests: Routes', () => {

    let baseUrl;
    let usrToken;
    let testId = "42a55fa0-18e9-482b-8619-3d7caa757ac9";
    let invalidId = 12345;

    // Permissions-API: Mocking interaction between Data Access Committee portal AND Permissions API (Assertions will be directly inserted in the test Permissions-DB).

    let assertions = {
        type : "ControlledAccessGrants",
        asserted: 1564814387,
        value: "https://test-url/TF001",
        source: "https://test-url/source_dac_01",
        by: "dac"
    };

    // Outbox-API: Mocking interaction between Outbox-API AND Catalogue Portal (User files metadata will be directly inserted in the test Outbox-DB).
    
    // Two cases: Allowed dataset AND Not Allowed (Related dataset assertions are not present anymore in the Permissions API).
    
    // Here example documents are provided for the interaction with both models.

    let userFilesOnlyAllowed = {
        _id: testId,
        fileIds: ["https://test-url/TF001"],
        analysis: ["vre"]
    }

    let userFiles = {
        _id: testId,
        fileIds: ["https://test-url/TF001", "https://test-url/TF002"],
        analysis: ["vre", "vre"]
    }

    let filesMetadata = [
        {
            _id: "https://test-url/TF001",
            metadata: {
                file_locator: "https://test-url/TF001",
                es_index: "test_index",
                access: "private"
            }
        }, 
        {
            _id: "https://test-url/TF002",
            metadata: {
                file_locator: "https://test-url/TF002",
                es_index: "test_index",
                access: "private"
            }
        }
    ]

    let validOutboxMeta = {
        _id: "https://test-url/TF001",
        metadata: {
            es_index: "test_index",
            file_locator: "https://test-url/TF001",
            analysis: "cavatica",
            access: "private"
        }
    };

    // Here invalid documents are provided for testing validators.
    let invalidDocuments = {
        indexErr : {
            _id: "https://test-url/TF001",
            metadata: {
                es_index: 12345,
                file_locator: "https://test-url/TF001",
                analysis: "vre",
                access: "private"
            }
        },
        locatorErr : {
            _id: "https://test-url/TF001",
            metadata: {
                es_index: "test_index",
                file_locator: 12345,
                analysis: "vre",
                access: "private"
            }
        },
        analysisErr : {
            _id: "https://test-url/TF001",
            metadata: {
                es_index: "test_index",
                file_locator: "https://test-url/TF001",
                analysis: "invalidAnalysisPlatform",
                access: "private"
            }
        }
    }

    beforeEach(async() => {
        baseUrl = process.env.KEYCLOAK_URL;
        usrToken = await tokenRequester(baseUrl, usrSettings);
    });

    afterEach(async () => { 
        app.server.close();
        await UserFiles.remove({});
        await FilesMetadata.remove({});
        await deleteUserPermissions(testId);
    });

    const queryBuilder = async (token, option, outboxDoc) => {
        switch (option) {
            case 0:
                return await request(app).post("/v1/metadata")
                                         .auth(usrToken, { type: 'bearer' })
                                         .send(outboxDoc)               
            case 1: 
                return await request(app).get("/v1/metadata/")
                                         .auth(token, { type: 'bearer' })                              
            case 3:
                return await request(app).delete('/v1/metadata/')
                                         .auth(token, { type: 'bearer' })                           
        }
    }
    
    describe('POST /v1/metadata', () => {

        it('It should insert a document', async () => {
            const response = await queryBuilder(usrToken, 0, validOutboxMeta)
            expect(response.status).toBe(200);
            expect(response.body.upserted).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ _id: validOutboxMeta._id })
                ])
            );
        });
        
        it('It should return 400 error if analysis field is invalid -> Only vre || cavatica allowed: ', async () => {
            const response = await queryBuilder(usrToken, 0, invalidDocuments.analysisErr)     
            expect(response.status).toBe(400);
        });

        it('It should return 400 error if es_index field is invalid -> Only strings allowed: ', async () => {
            const response = await queryBuilder(usrToken, 0, invalidDocuments.indexErr)        
            expect(response.status).toBe(400);
        });

        it('It should return 400 error if file_locator field is invalid -> Only strings allowed: ', async () => {
            const response = await queryBuilder(usrToken, 0, invalidDocuments.locatorErr)        
            expect(response.status).toBe(400);
        });

    });
    
    // This will need refactoring.
    describe('GET /v1/metadata', () => {
        it('It should return ONE document', async () => {
            await UserFiles.collection.insert(userFilesOnlyAllowed)
            await FilesMetadata.collection.insert(filesMetadata[0])
            await postUserPermissions(testId, assertions)
            const response = await queryBuilder(usrToken, 1)
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ _id: userFilesOnlyAllowed.fileIds[0] })
                ])
            );
        })

        it('It should return only allowed documents - Permissions API interaction', async () => {
            await UserFiles.collection.insert(userFiles)
            await FilesMetadata.collection.insertMany([filesMetadata[0], filesMetadata[1]])
            await postUserPermissions(testId, assertions)
            const response = await queryBuilder(usrToken, 1)
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ _id: userFilesOnlyAllowed.fileIds[0] })
                ])
            );
        })

    }); 
    
    // This test suite has to be extended.
    describe('DELETE /v1/metadata', () => {
        /*
        it('It should return 400 error if an invalid fileId is supplied: ', async () => {
            await UserFiles.collection.insert(invalidOutboxDoc)
 
            const response = await queryBuilder(usrToken, 3)

            expect(response.status).toBe(400);
        });
        
        it('It should return 400 error if multiple fileId are supplied: ', async () => {
            await UserFiles.collection.insert(invalidOutboxDoc)
 
            const response = await queryBuilder(usrToken, 3, validId)
            
            expect(response.status).toBe(400);
        });
        */
        it('It should remove a single document and return 200', async () => {

            await UserFiles.collection.insert(userFilesOnlyAllowed)
            await FilesMetadata.collection.insert(filesMetadata[0])
            
            await postUserPermissions(testId, assertions)
            
            let response = await queryBuilder(usrToken, 1)

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ _id: userFilesOnlyAllowed.fileIds[0] })
                ])
            );

            response = await queryBuilder(usrToken, 3, userFilesOnlyAllowed)
            
            expect(response.status).toBe(200);
            expect(response.body.nModified).toEqual(1);
        });
    });
});

