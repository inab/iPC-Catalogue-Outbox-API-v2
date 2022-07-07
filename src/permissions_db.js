let MongoClient = require('mongodb').MongoClient
let db;
let host = process.env.NODE_ENV === 'prod' ? process.env.MONGO_HOST : process.env.MONGO_HOST_TEST;
let permissions_db = process.env.NODE_ENV === 'prod' ? process.env.MONGO_DB_PERMISSIONS : process.env.MONGO_DB_PERMISSIONS_TEST	;
let username = process.env.MONGO_USER;
let password = process.env.MONGO_PASS;
let authSource = process.env.MONGO_AUTH;
let replicaSet = process.env.MONGO_REPLICASET;
let uri = process.env.NODE_ENV === 'prod' ? `mongodb://${username}:${password}@${host}/${db}?authSource=${authSource}` :
            `mongodb://${username}:${password}@${host}/${db}?connectTimeoutMS=300000&replicaSet=rs0&authSource=${authSource}`

MongoClient.connect(uri, function (err, client) {
  	if (err) throw err
	console.log("Permissions api: successfully connected")
	console.log("Permissions HOST: ", host)
	console.log("Permissions DB: ", permissions_db)
  	db = client.db(permissions_db)
})

const checkUserPermissions = async (id) => {
    let response = await db.collection('userPermissions').find({ 'sub' : id }).project({assertions:1, _id:0}).toArray()
	return response
}

const postUserPermissions = async (id, assertions) => {
	await db.collection('userPermissions').insertOne(
		{ "sub" : id, 
		  "assertions" : [{
				"type": assertions.type,
				"asserted": assertions.asserted,
				"value": assertions.value,
				"source": assertions.source,
				"by": assertions.by
			}]
	})
}

const deleteUserPermissions = async (id) => {
	await db.collection('userPermissions').deleteOne( { "sub" : id } )
}

export { checkUserPermissions, postUserPermissions, deleteUserPermissions }