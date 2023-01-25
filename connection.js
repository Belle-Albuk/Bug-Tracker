require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main(callback) {
    const URI = process.env.MONGO_URI; // Connection URI
    const client = new MongoClient(URI, {useNewUrlParser: true, useUnifiedTopology: true}); // Create a new MongoDB instance

    try {
        // Connect the client to the server to get the MongoDB cluster
        await client.connect();

        // Make the proper DB call
        await callback(client);
    } catch (e) {
        // Catch any errors
        console.error(e);
        throw new Error('Unable to connect to the Database')
    }
}

module.exports = main;