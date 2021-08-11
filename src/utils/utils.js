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
    
    let filesId = userObject[0].fileIds; 

    return filesId
}

// 1.C. OUTBOX DB: GET USER FILES METADATA.
const getFilesMetadata = async (id) => {

    let selection = '_id analysis metadata.file_locator metadata.es_index';

    let docs = await UserFiles.find({ '_id' : id })
                              .populate({ path: 'fileIds', select: selection });

    const response = metadataBuilder(docs)

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
                analysis : documents[0].analysis[index]
            }
        })
    }); 

    return wrap;
}

// 1.E. OUTBOX DB: FILTER FOR FILEIDS THAT HAVE BEEN REMOVED FROM PERMISSIONS DB.
const updateUserFiles = async (id, outbox, allowed) => {

    let allowedFileIds = allowed[0].assertions.map(el => el.value)

    let notAllowed = outbox.filter(el => !allowedFileIds.includes(el))

    let del = await Promise.all(notAllowed.map(async (item) => await deleteFileById(id, item)));

    let response = await getFilesMetadata(id);

    return response;
}

// 2. POST:

// 2.A. OUTBOX DB: INSERT DOCUMENT BY USERID -> UserFiles and FilesMetadata models.
const postFileId = async (id, object) => {
    let response = await UserFiles.updateOne({ '_id' : id },
                                       { $addToSet: { "fileIds" : object._id } }, 
                                       { new: true, upsert: true })

    if(response.nModified === 1) {
        await UserFiles.updateOne({ '_id' : id },
                                  { $push: { "analysis" : object.metadata.analysis } }) 
    }                                   

    response = await FilesMetadata.updateOne(  { '_id' : object._id },
                                       { $set: { "metadata.file_locator" : object.metadata.file_locator, 
                                                 "metadata.es_index" : object.metadata.es_index } },
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

    await UserFiles.update({ '_id' : id }, { $unset: { [`analysis.${index}`] : 1 } })
    
    response = await UserFiles.update({ '_id' : id }, { $pull: { 'analysis' : null } }, { new: true })
    
    return response
}

exports.getFilesId = getFilesId;
exports.getUserPermissions = getUserPermissions;
exports.getFilesMetadata = getFilesMetadata;
exports.updateUserFiles = updateUserFiles;
exports.postFileId = postFileId;
exports.deleteFileById = deleteFileById;
