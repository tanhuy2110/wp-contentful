require('dotenv').config();
const axios = require('axios');
const TurndownService = require('turndown');

const {
	CONTENT_DELIVERY_API,
	CONTENTFUL_SPACE_ID,
	CONTENTFUL_ENV_NAME,
	CONTENT_MANAGEMENT_TOKEN
} = process.env;
/**
 * Object to store Contentful Data in.
 */
let contentfulData = []

/**
 * Markdown / Content conversion functions.
 */
const turndownService = new TurndownService({
  	codeBlockStyle: 'fenced'
})

/**
 * Convert HTML codeblocks to Markdown codeblocks.
 */
turndownService.addRule('fencedCodeBlock', {
	filter: function (node, options) {
		return (
		options.codeBlockStyle === 'fenced' &&
		node.nodeName === 'PRE' &&
		node.firstChild &&
		node.firstChild.nodeName === 'CODE'
		)
	},
	replacement: function (content, node, options) {
		let className = node.firstChild.getAttribute('class') || ''
		let language = (className.match(/language-(\S+)/) || [null, ''])[1]

		return (
		'\n\n' + options.fence + language + '\n' +
		node.firstChild.textContent +
		'\n' + options.fence + '\n\n'
		)
	}
})

/**
 * Convert inline HTML images to inline markdown image format.
 */
turndownService.addRule('replaceWordPressImages', {
	filter: ['img'],
	replacement: function(content, node, options) {
		let assetUrl = contentfulData.assets.filter(asset => {
			let assertFileName = asset.split('/').pop()
			let nodeFileName = node.getAttribute('src').split('/').pop()

			if (assertFileName === nodeFileName) {
				return asset
			}
		})[0];

		return `![${node.getAttribute('alt')}](${assetUrl})`
	}
})

function createContentfulAssets(environment, promises, assets) {
	return Promise.all(
		promises.map((asset, index) => new Promise(async resolve => {
			let newAsset;
			setTimeout(() => {
				try {
					newAsset = environment.createAsset({
						fields: asset
					})
					.then((asset) => asset.processForAllLocales())
					.then((asset) => asset.publish())
					.then((asset) => {
						console.log(`-- Published Asset: ${asset.fields.file['en-US'].fileName}`);
						assets.push({
							assetId: asset.sys.id,
							fileName: asset.fields.file['en-US'].fileName
						})
					})
				} catch (error) {
					throw(Error(error))
				}

				resolve(newAsset)
			}, 1000 + (5000 * index));
		}))
	);
}

/**
 * For each post data tree, publish a Contentful entry.
 * @param {String} environment - Name of Contentful Environment.
 * @param {Array} promises - data trees for Contentful posts.
 */
function createContentfulEntries(environment, promises) {
	return Promise.all(promises.map((post, index) => new Promise(async resolve => {
		let newPost;
		console.log(`Attempting: ${post.slug['en-US']}`)
		setTimeout(() => {
			try {
				newPost = environment.createEntry('blogPost', {
					fields: post
				})
				.then((entry) => entry.publish())
				.then((entry) => {
					console.log(`Success: ${entry.fields.slug['en-US']}`)
				})
			} catch (error) {
				throw(Error(error))
			}
			resolve(newPost)
		}, 1000 + (5000 * index));
	})));
}

/**
 * For each WordPress post, build the data for a Contentful counterpart.
 * @param {String} environment - Name of Contentful Environment.
 * @param {Array} assets - array to store Assets in
 */
function createContentfulPosts(environment, assets, wpData) {
	console.log(`Creating Contentful Posts...`)
	let promises = []
	for (const [index, post] of wpData.posts.entries()) {
		let postFields = {};
		let fieldCategory = [];
		for (let [postKey, postValue] of Object.entries(post)) {
			
			if (postKey === 'categories') {
				postValue.forEach(function(item) {
					let entryObj = {
						sys: {
							type: "Link",
							linkType: "Entry",
							id: item
						}
					}
					fieldCategory.push(entryObj)
				});
			}
			if (postKey === 'content') {
				postValue = turndownService.turndown(postValue)
			}

			/**
			 * Remove values/flags/checks used for this script that
			 * Contentful doesn't need.
			 */
			let keysToSkip = [
				'id',
				'type',
				'contentImages'
			]

			if (!keysToSkip.includes(postKey)) {
				postFields[postKey] = {
					'en-US': postValue
				}
			}

			if (postKey === 'featuredImage' && postValue > 0) {
				let assetObj = assets.filter(asset => {
					if (asset.fileName === post.contentImages[0].link.split('/').pop()) {
						return asset;
					}
				})[0];

				postFields.featuredImage = {
					'en-US': {
						sys: {
							type: 'Link',
							linkType: 'Asset',
							id: assetObj.assetId
						}
					}
				}
			}

			// No image and Contentful will fail if value is '0', so remove.
			if (postKey === 'featuredImage' && postValue === 0) {
				delete postFields.featuredImage
			}

			if (postKey === 'categories') {
				postFields.categories = 
				{
					'en-US' : fieldCategory
				}
			}
		}
		promises.push(postFields)
	}
	console.log(`Post objects created, attempting to create entries...`)
	createContentfulEntries(environment, promises)
		.then((result) => {
			console.log(`The migration has completed.`);
		});
}

function getAndStoreAssets(environment, assets, wpData) {
	console.log(`Storing asset URLs in a global array to use later`);
	// https://www.contentful.com/developers/docs/references/content-management-api/#/reference/assets/published-assets-collection/get-all-published-assets-of-a-space/console/js
	axios.get(`https://api.contentful.com/spaces/${CONTENTFUL_SPACE_ID}/environments/${CONTENTFUL_ENV_NAME}/public/assets`,
	{
		headers: {
			'Authorization':`Bearer ${CONTENT_MANAGEMENT_TOKEN}`
		}
	})
	.then((result) => {
		contentfulData.assets = []
		
		for (const item of result.data.items) {
			contentfulData.assets.push(item.fields.file['en-US'].url)
		}
		createContentfulPosts(environment, assets, wpData)

	}).catch((err) => {
		console.log(err)
		return error;
	});
}


function buildContentfulAssets(environment, wpData) {
	let assetPromises = []

	console.log('- Building Contentful Asset Objects')

	// For every image in every post, create a new asset.
	for (let [index, wpPost] of wpData.posts.entries()) {
		for (const [imgIndex, contentImage] of wpPost.contentImages.entries()) {
			let assetObj = 
			{
				title: {
					'en-US': contentImage.title
				},
				description: {
					'en-US': contentImage.description
				},
				file: {
					'en-US': {
						contentType: 'image/jpeg',
						fileName: contentImage.link.split('/').pop(),
						upload: encodeURI(contentImage.link)
					}
				}
			}
			assetPromises.push(assetObj);
		}
	}
	let assets = []

	console.log(`- Creating Contentful Assets...`)

	createContentfulAssets(environment, assetPromises, assets)
    .then((result) => {
        getAndStoreAssets(environment, assets, wpData)
    })
}
async function uploadAssets(environment, wpData) {
    try {
        await buildContentfulAssets(environment, wpData);
    } catch (error) {
        console.log('Error in upload-assets', error)
    }
}

module.exports = uploadAssets;