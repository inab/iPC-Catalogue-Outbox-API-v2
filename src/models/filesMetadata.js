import Joi from 'joi';
import mongoose from 'mongoose';

const metadataSchema = new mongoose.Schema({
    file_locator: {
        type: String,
        required: true
    },
    es_index: {
        type: String,
        required: true
    },
    access: {
        type: String,
        required: true
    }
});

const filesMetadataSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    metadata: metadataSchema
}, { collection: 'filesMetadata' });

const FilesMetadata = mongoose.model('filesMetadata', filesMetadataSchema);

export { FilesMetadata }