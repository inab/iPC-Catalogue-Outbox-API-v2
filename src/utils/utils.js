// IMPORT MONGOOSE MODELS AND PERMISSIONS-DB.
import { UserFiles } from '../models/userFiles';
import { FilesMetadata } from '../models/filesMetadata';
import { checkUserPermissions } from '../permissions_db';

/* FUNCTIONS */

// 1. GET:

// 1.A. PERMISSIONS DB: GET FILES PERMISSIONS BY USERID.
const getUserPermissions = async (id) => {
    return await checkUserPermissions(id)
}

// 1.B. OUTBOX DB: GET USER FILESID BY USERID.
const getFilesId = async (id) => {

    const userObject = await UserFiles.find({ '_id' : id })
                                      .select({ '_id' : 0, 'sub' : 0 });
    
    let filesId = []

    if(userObject.length > 0) filesId = userObject[0].fileIds; 

    return filesId
}

// 1.C. OUTBOX DB: GET USER FILES METADATA.
const getFilesMetadata = async (id) => {

    let selection = '_id analysis metadata.file_locator metadata.es_index metadata.access';

    let docs = await UserFiles.find({ '_id' : id })
                              .populate({ path: 'fileIds', select: selection });

    let response = [];

    if(docs.length > 0){
        response = metadataBuilder(docs)
    }
    
    return response
}

// 1.D. OUTBOX DB: FN THAT BUILDS A RESPONSE OBJECT FOR 1.C.
const metadataBuilder = async (documents) => {
    let wrap = [];

    documents[0].fileIds.map((item, index) => { 
        wrap.push({
            _id: item._id,
            metadata: {
                es_index : item.metadata.es_index,
                file_locator : item.metadata.file_locator,
                access : item.metadata.access,
                analysis : documents[0].analysis[index]
            }
        })
    }); 

    return wrap;
}

// 1.E. OUTBOX DB: FILTER FOR FILEIDS THAT HAVE BEEN REMOVED FROM PERMISSIONS DB.
const updateUserFiles = async (id, outbox, allowed) => {

    let outboxPublicDocs = [];
    let outboxPublicFileIds = [];
    let outboxPrivateDocs = [];
    let outboxPrivateFileIds = [];
    let permissionsPrivateFileIds = [];
    let privateNotAllowed = [];
    let privateAllowed = [];

    // First we get IDs from public datasets from Outbox-DB.
    outboxPublicDocs = outbox.filter(el => el.metadata.access === 'public');
    outboxPublicFileIds.push(outboxPublicDocs.map(el => el._id));
    outboxPublicFileIds = outboxPublicFileIds.reduce((a, b) => a.concat(b), []);
    // Then, the private datasets IDs from Outbox-DB.
    outboxPrivateDocs = outbox.filter(el => el.metadata.access === 'private');
    outboxPrivateFileIds.push(outboxPrivateDocs.map(el => el._id));
    outboxPrivateFileIds = outboxPrivateFileIds.reduce((a, b) => a.concat(b), []);
    
    // Here we create a whitelist (allowed) and blacklist (not allowed) based on user Permissions.
    if(allowed.length > 0){
        // From Permissions-DB.
        permissionsPrivateFileIds = allowed[0].assertions.map(el => el.value.split(":").pop());
        // Create an array with the forbidden IDs.
        privateNotAllowed = outboxPrivateFileIds.filter(el => !permissionsPrivateFileIds.includes(el));
        // And another array with the whitelisted private docs
        privateAllowed = outboxPrivateDocs.filter(el => permissionsPrivateFileIds.includes(el._id));
    } else {
        privateNotAllowed = outboxPrivateFileIds;
        privateAllowed = [];
    }
    
    // Here we delete registered files for this specific user. 
    await Promise.all(privateNotAllowed.map(async (item) => await deleteFileById(id, item)));

    // Finally, concatenate Public and Private allowed docs.
    let response = privateAllowed.concat(outboxPublicDocs)

    return response;
}

// 2. POST:

// 2.A. OUTBOX DB: INSERT DOCUMENT BY USERID -> UserFiles and FilesMetadata* models. *to be reviewed.
const postFileId = async (id, object) => {

    let response = await UserFiles.find({ '_id' : id, 'fileIds' : object._id }); 

    if(response.length === 0) {
        await UserFiles.updateOne({ '_id' : id },
                                  { $push: { "fileIds" : object._id, "analysis" : object.metadata.analysis } },
                                  { new: true, upsert: true }) 
    }  

    // This fn must be reviewed: Users should not be able to interact with FilesMetadata collection (only sysadmin). 
    // Instead, this data has to be present in advance in the Outbox-DB || fetched from ES.
    response = await FilesMetadata.updateOne({ '_id' : object._id },
                                             { $set: {  "metadata.file_locator" : object.metadata.file_locator, 
                                                        "metadata.es_index" : object.metadata.es_index,
                                                        "metadata.access" : object.metadata.access } },
                                             { new: true, upsert: true })

    return response
}

// 3. DELETE:

// 3.A. OUTBOX DB: DELETE DOCUMENT BY USERID AND FILEID.
const deleteFileById = async (id, fileId) => {

    let response;

    const userObject = await UserFiles.find({ '_id' : id })
                                      .select({ '_id' : 0, 'sub' : 0 });

    let fileIds = userObject[0].fileIds;
    
    let index = 0;

    for(let i in fileIds) {
        if(fileIds[i] === fileId){
            index = i
        } 
    }

    let remove = await UserFiles.findOneAndUpdate( { '_id' : id },
                                                   { $pull : { 'fileIds' : fileId } },
                                                   { new: true }) 
    
    if(remove.nModified === 0) return response 

    await UserFiles.updateOne({ '_id' : id }, { $unset: { [`analysis.${index}`] : 1 } })
    
    response = await UserFiles.updateOne({ '_id' : id }, { $pull: { 'analysis' : null } }, { new: true })

    return response
}

export { getFilesId, getUserPermissions, getFilesMetadata, postFileId, deleteFileById, updateUserFiles }
