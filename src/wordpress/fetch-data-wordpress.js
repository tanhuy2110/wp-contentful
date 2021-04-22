const axios = require('axios');
const fs = require('fs');
const TurndownService = require('turndown');

/**
 * API Endpoints that we'd like to receive data from
 * (e.g. /wp-json/wp/v2/${key})
 */
let wpData = {
	'posts': [],
	'tags': [],
	'categories': [],
	'media': []
};

/**
 * Object to store WordPress API data in
 */
let apiData = {}

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




function getAllData(URLs){
  	return Promise.all(URLs.map(fetchData));
}

function fetchData(URL) {
	return axios.get(URL).then(function(response) {
        return {
            success: true,
            endpoint: '',
            data: response.data
        };
    }).catch(function(error) {
        return { success: false };
    });
}

/**
 * Helper function to get a specific data tree for a type of resource.
 * @param {String} resourceName - specific type of WP endpoint (e.g. posts, media)
 */
function getApiDataType(resourceName) {
	let apiType = apiData.filter(obj => {
		if (obj.endpoint === resourceName) {
			return obj
		}
	});
	return apiType
}

function getPostLabels(postItems, labelType) {
	let labels = []
	let apiTag = getApiDataType(labelType)[0];

	for (const labelId of postItems) {
		let labelName = apiTag.data.filter(obj => {
            if (obj.id === labelId) {
                return obj.name
            }
		});

		labels.push(labelName[0].name)
	}

	return labels
}

function getPostBodyImages(postData) {
	// console.log(`- Getting content images`)
	let imageRegex = /<img\s[^>]*?src\s*=\s*['\"]([^'\"]*?)['\"][^>]*?>/g
	let bodyImages = []

	if (postData.featured_media > 0) {
		let mediaData = getApiDataType(`media`)[0];
		let mediaObj = mediaData.data.filter(obj => {
			if (obj.id === postData.featured_media) {
				return obj
			}
		})[0];
		bodyImages.push({
			link: mediaObj.source_url,
			description: mediaObj.alt_text,
			title:  mediaObj.alt_text,
			mediaId: mediaObj.id,
			postId: mediaObj.post,
			featured: true
		})
	}

	while (foundImage = imageRegex.exec(postData.content.rendered)) {
		let loc_arr = foundImage[0].split('src="')[1].split('"')[0].split("/");
		bodyImages.push({
			link: foundImage[1],
			description: loc_arr[loc_arr.length - 1],
			title: loc_arr[loc_arr.length - 1],
			postId: postData.id,
			featured: true
		})
	}
	return bodyImages
}

function writeDataToFile(dataTree, dataType) {
	console.log(`Writing data to a file`)

	fs.writeFile(`./${dataType}.json`, JSON.stringify(dataTree, null, 2), (err) => {
		if (err) {
			console.error(err);
			return;
		};
		console.log(`writeDataToFile...Done!`)
	});
}

function mapData() {
	for (const [index, [key, value]] of Object.entries(Object.entries(wpData))) {
		apiData[index].endpoint = key
	}

	console.log(`Reducing API data to only include fields we want`)
	let apiPosts = getApiDataType('posts')[0];
	for (let [key, postData] of Object.entries(apiPosts.data)) {
		console.log(`Parsing Post: ${postData.slug}`)
		let fieldData = 
		{
			id: postData.id,
			type: postData.type,
			title: postData.title.rendered,
			slug: postData.slug,
			content: postData.content.rendered,
			publishDate: postData.date_gmt + '+00:00',
			featuredImage: postData.featured_media,
			tags: getPostLabels(postData.tags, 'tags'),
			categories: getPostLabels(postData.categories, 'categories'),
			contentImages: getPostBodyImages(postData)
		}
		wpData.posts.push(fieldData);
	}

	let apiCategories = getApiDataType('categories')[0];
	for (let [key, categoryData] of Object.entries(apiCategories.data)) {
		console.log(`Parsing Category: ${categoryData.slug}`)
		let fieldData = 
		{
			name: categoryData.name,
			slug: categoryData.slug,
		}
		wpData.categories.push(fieldData);
	}

	writeDataToFile(wpData, 'wpData');

	return new Promise.resolve(wpData);
}

function fetchPosts(domain) {
    let promises = [];
    console.log(`Getting WordPress API data`)
    for (const [key, value] of Object.entries(wpData)) {
        let wpUrl = `${domain}${key}?per_page=1`
        promises.push(wpUrl)
    }
   
    getAllData(promises)
    .then(response =>{
        apiData = response;
        mapData();
    }).catch(error => {
        console.log(error)
    })
}

module.exports = fetchPosts;