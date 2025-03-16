const { MongoClient } = require("mongodb");
// Replace the uri string with your connection string.
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

const database = client.db('xiaohuohua-sketch');

module.exports = database