import mongoose from 'mongoose';
import winston from 'winston';

export default callback => {
	let host = process.env.NODE_ENV === 'prod' ? process.env.MONGO_HOST : process.env.MONGO_HOST_TEST;	
	let db = process.env.NODE_ENV === 'prod' ? process.env.MONGO_DB_OUTBOX : process.env.MONGO_DB_OUTBOX_TEST;
	let username = process.env.MONGO_USER;
	let password = process.env.MONGO_PASS;
	let authSource = process.env.MONGO_AUTH;
        let replicaSet = process.env.MONGO_REPLICASET;
        // connect to MongoDB, then pass it to the callback fn:
        let uri = process.env.NODE_ENV === 'prod' ? `mongodb://${username}:${password}@${host}/${db}?authSource=${authSource}` :
            `mongodb://${username}:${password}@${host}/${db}?connectTimeoutMS=300000&replicaSet=rs0&authSource=${authSource}`
        const mongo = mongoose.connect(uri)
            .then(() => winston.info(`Connected to ${db}`))
        callback(mongo);
}
