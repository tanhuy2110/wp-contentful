require('dotenv').config();

const { async } = require('rxjs');
const createClient = require("./contentful/create-client");
const creatContentModel = require("./contentful/create-content-model");
const fetchDataWP = require('./wordpress/fetch-data-wordpress');

const {
	WP_API_URL,
    CONETNT_MANAGEMENT_TOKEN,
	CONTENT_DELIVERY_API,
	CONTENTFUL_SPACE_ID,
	CONTENTFUL_ENV_NAME,
	CONTENTFUL_LOCALE,
} = process.env;

async function init() {
    try {
        // Create Client
        const client = await createClient(CONETNT_MANAGEMENT_TOKEN, CONTENTFUL_SPACE_ID, CONTENTFUL_ENV_NAME);

        // Create Contentful Model 
        // const createModel = await creatContentModel(client);

        //  Fetch Data from WP
        const post = await fetchDataWP(WP_API_URL);
        // fetchDataWP(WP_API_URL).then(v => console.log(v));
        console.log('index--------', post);

    } catch (error) {
        console.log('Error at index.js', error)
    }
}

init();