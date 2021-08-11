let MongoClient = require('mongodb').MongoClient
let db;
let host = process.env.MONGO_HOST_PERMISSIONS;	
let permissions_db = process.env.MONGO_DB_PERMISSIONS;
let username = process.env.MONGO_USER_PERMISSIONS;
let password = process.env.MONGO_PASS_PERMISSIONS;
let authSource = process.env.MONGO_AUTH_PERMISSIONS;

MongoClient.connect(`mongodb://${username}:${password}@${host}/${permissions_db}?authSource=${authSource}`, function (err, client) {
  	if (err) throw err
  	console.log("Permissions api: successfully connected")
  	db = client.db('permissions_api')
})

const checkUserPermissions = async (id) => {
    let response = await db.collection('userPermissions').find({ 'sub' : id }).project({assertions:1, _id:0}).toArray()
	return response
}

exports.checkUserPermissions = checkUserPermissions
