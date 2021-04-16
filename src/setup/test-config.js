const fetch = require("node-fetch");

const {
    WP_API_URL,
    CONTENT_DELIVERY_API,
    CONTENTFUL_ENV_NAME,
    CONTENTFUL_SPACE_ID,
    CONTENTFUL_LOCALE,
} = require("../util");

const WP_ERR_MSG = `WordPress unreachable at ${WP_API_URL}, check env config and internet connection`;
const CFUL_ERR_BASE = `No value given for required Contentful config var: `;

async function config() {
  // Ping WP API
  const response = await fetch(WP_API_URL);
  if (response.status !== 200) throw new Error(WP_ERR_MSG);
  if (!CONTENT_DELIVERY_API) {
    throw new Error(CFUL_ERR_BASE + "CONTENT_DELIVERY_API");
  }
  if (!CONTENTFUL_SPACE_ID) {
    throw new Error(CFUL_ERR_BASE + "CONTENTFUL_SPACE_ID");
  }
  if (!CONTENTFUL_ENV_NAME) {
    throw new Error(CFUL_ERR_BASE + "CONTENTFUL_ENV_NAME");
  }
  if (!CONTENTFUL_LOCALE) {
    throw new Error(CFUL_ERR_BASE + "CONTENTFUL_LOCALE");
  }
}

module.exports = config;
