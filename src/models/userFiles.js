import Joi from 'joi';
import mongoose from 'mongoose';

const userFilesSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    fileIds: [{
        type: String,
        ref: 'filesMetadata',
        required: true
    }],
    analysis: [{
        type: String,
        required: true
    }]
}, { collection: 'userFiles' });

const UserFiles = mongoose.model('userFiles', userFilesSchema);

function validate(bodyObject){
    const schema = Joi.object().keys({
            es_index: Joi.string().required(),
            file_locator: Joi.string().required(),
            analysis: Joi.string().valid('vre', 'cavatica').required()
        })
    
    return schema.validate(bodyObject);
}

export { UserFiles, validate }