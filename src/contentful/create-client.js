const contentful = require("contentful-management");

async function createClient(managementToken, spaceId, envName) {
    try {
        const client = await contentful.createClient({
            accessToken: managementToken
        });

        const space = await client.getSpace(spaceId);
        const environment = await space.getEnvironment(envName);

        return environment;
    } catch (error) {
        console.log('Error in create-client: ', error);
    }
}

module.exports = createClient;
