require("dotenv").config();

const path = require("path");
const glob = require("glob");

// when task is ran as singular node process and not as Listr task
const MOCK_OBSERVER = { next: console.log, complete: console.success };

const BUILD_DIR = path.join(process.cwd(), "dist");
const {
	WP_API_URL,
	CONTENT_DELIVERY_API,
	CONTENTFUL_SPACE_ID,
	CONTENTFUL_ENV_NAME,
	CONTENTFUL_LOCALE,
} = process.env;

// Awaitable globz
const findByGlob = (pattern = "", opts = {}) =>
	new Promise((resolve, reject) => {
		glob(pattern, opts, (err, files) => (err ? reject(err) : resolve(files)));
	});

module.exports = {
	MOCK_OBSERVER,
	BUILD_DIR,
	WP_API_URL,
	CONTENT_DELIVERY_API,
	CONTENTFUL_SPACE_ID,
	CONTENTFUL_ENV_NAME,
	CONTENTFUL_LOCALE,
	findByGlob,
};
