import { version } from '../../package.json';
import { Router } from 'express';
import { getUserPermissions, getFilesId, getFilesMetadata, updateUserFiles,
         postFileId, deleteFileById } from '../utils/utils';
import { validate } from '../models/userFiles';
import jwt_decode from "jwt-decode";
import createError from 'http-errors';

export default ({ keycloak }) => {
	let api = Router();

	api.get('/', keycloak.protect(), async function(req, res){

                const userId = jwt_decode(req.headers.authorization);

                let filePermissions = await getUserPermissions(userId.sub);

                let filesMetadata = await getFilesMetadata(userId.sub);
                
                if(filesMetadata.length === 0) res.send([]) 

                else res.send(await updateUserFiles(userId.sub, filesMetadata, filePermissions));
       
	})
        
	api.post('/', keycloak.protect(), async function(req, res){

                const userId = jwt_decode(req.headers.authorization)
                
                const bodyParams = req.body;

                // Validate with Joi. To be reviewed -> Check postFileId fn comments.
		const { error } = validate({ 	
			es_index : bodyParams.metadata.es_index,
			file_locator : bodyParams.metadata.file_locator,
			analysis : bodyParams.metadata.analysis
                })

                if(error) throw createError(400, "Bad request")

                let response = await postFileId(userId.sub, bodyParams);
                
                res.send(response)
        })

	api.delete('/', keycloak.protect(), async function(req, res){

                const userId = jwt_decode(req.headers.authorization);

                const fileId = req.body._id;

                let response = await deleteFileById(userId.sub, fileId);

                if(!response) res.status(200).send({ message : "No record has been deleted" })

                res.send(response)
        })

	return api;
}
