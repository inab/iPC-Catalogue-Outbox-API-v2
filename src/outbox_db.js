import mongoose from 'mongoose';
import winston from 'winston';

require('dotenv').config();

export default callback => {
	let host = process.env.NODE_ENV === 'test' ? process.env.MONGO_HOST_TEST : process.env.MONGO_HOST;	
	let db = process.env.NODE_ENV === 'test' ? process.env.MONGO_DB_OUTBOX_TEST : process.env.MONGO_DB_OUTBOX;
	let username = process.env.MONGO_USER;
	let password = process.env.MONGO_PASS;
	let authSource = process.env.MONGO_AUTH;
        let replicaSet = process.env.MONGO_REPLICASET;
	// connect to MongoDB, then pass it to the callback fn:
	const mongo = mongoose.connect(`mongodb://${username}:${password}@${host}/${db}??connectTimeoutMS=300000&replicaSet=${replicaSet}&authSource=${authSource}`)
		.then(() => winston.info(`Connected to ${db}`))
	callback(mongo); 
}
