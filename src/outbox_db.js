import mongoose from 'mongoose';
import winston from 'winston';

export default async() => {
	let host = process.env.NODE_ENV === 'prod' ? process.env.MONGO_HOST : process.env.MONGO_HOST_TEST;	
	let db = process.env.NODE_ENV === 'prod' ? process.env.MONGO_DB_OUTBOX : process.env.MONGO_DB_OUTBOX_TEST;
	let username = process.env.MONGO_USER;
	let password = process.env.MONGO_PASS;
	let authSource = process.env.MONGO_AUTH;
    let replicaSet = process.env.MONGO_REPLICASET;
    let uri = process.env.NODE_ENV === 'prod' ? `mongodb://${username}:${password}@${host}/${db}?authSource=${authSource}` :
        `mongodb://${username}:${password}@${host}/${db}?connectTimeoutMS=300000&replicaSet=${replicaSet}&authSource=${authSource}`
    try {
        await mongoose.connect(uri)
        winston.info(`Connected to the database: ${db}`)
    } catch (e) {
        console.error("Database connection failed:", e);
    }
}