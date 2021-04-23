require('dotenv').config();

const { async } = require('rxjs');
const createClient = require("./contentful/create-client");
const creatContentModel = require("./contentful/create-content-model");
const fetchDataWP = require('./wordpress/fetch-data-wordpress');
const uploadAssets = require('./contentful/upload-assets');
const creatContentfulCategory = require('./contentful/create-contentful-category');

const {
	WP_API_URL,
    CONTENT_MANAGEMENT_TOKEN,
	CONTENT_DELIVERY_API,
	CONTENTFUL_SPACE_ID,
	CONTENTFUL_ENV_NAME,
	CONTENTFUL_LOCALE,
} = process.env;

async function init() {
    try {
        // Create Client
        const client = await createClient(CONTENT_MANAGEMENT_TOKEN, CONTENTFUL_SPACE_ID, CONTENTFUL_ENV_NAME);

        // Create Contentful Model 
        const createModel = await creatContentModel(client);

        //  Fetch Data from WP
        const wpData = await fetchDataWP(WP_API_URL);

        // Create Contentful Category
        const storeCategory = await creatContentfulCategory(client, wpData);

        // Create Contentful Post
        const upload = await uploadAssets(client, wpData);
    } catch (error) {
        console.log('Error at index.js', error)
    }
}

init();