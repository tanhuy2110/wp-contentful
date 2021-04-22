const contentful = require('contentful-management');

const fieldContentTypeCategory = [
    {
        id: 'name',
        name: 'Name',
        required: true,
        localized: false,
        type: 'Symbol',
        disabled: false,
		omitted: false
    }, {
        id: 'slug',
        name: 'Slug',
        required: true,
        localized: false,
        type: 'Symbol',
        disabled: false,
		omitted: false
    }
];

const fieldContentTypeBlogPost = [
	{
		id: 'title',
        name: 'Title',
        required: true,
        localized: false,
        type: 'Symbol',
        disabled: false,
		omitted: false
	},
	{
		id: 'slug',
		name: 'Slug',
		required: true,
		localized: false,
		type: 'Symbol',
		disabled: false,
		omitted: false
	},
	{
		id: 'content',
		name: 'Content',
		required: true,
		localized: false,
		type: 'Text',
		disabled: false,
		omitted: false
	},
	{
		id: "publishDate",
		name: "Publish Date",
		type: "Date",
		localized: false,
		required: true,
		validations: [],
		disabled: false,
		omitted: false
	},
    {
        id: "featuredImage",
        name: "Featured Image",
        type: "Link",
        localized: false,
        required: true,
        validations: [],
        disabled: false,
        omitted: false,
        linkType: "Asset"
    },
    {
        id: "tags",
        name: "Tags",
        type: "Array",
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        items: {
            type: "Symbol",
            validations: [
                {
                    in: [
                        "general",
                        "javascript",
                        "static-sites"
                    ]
                }
            ]
        }
    },
    {
        id: "categories",
        name: "Categories",
        type: "Array",
        localized: false,
        required: true,
        validations: [],
        disabled: false,
        omitted: false,
        items: {
            type: "Link",
            validations: [],
            linkType: "Entry"
        }
    },
]

async function createCategory(client) {
    client.createContentTypeWithId('category',{
        name: 'Category',
        displayField: 'name',
        fields: fieldContentTypeCategory
    })
    .then((contentType) => contentType.publish())
    .then(() => console.log('------ Create Category Successfully!'))
    .catch(console.error)
}

async function createBlogPost(client) {
    client.createContentTypeWithId('blogPost',{
        name: 'Blog Post',
        displayField: 'title',
        fields: fieldContentTypeBlogPost
    })
    .then((contentType) => contentType.publish())
    .then(() => console.log('------ Create Blog Post Successfully!'))
    .catch(console.error)
}


async function creatContentModel(client) {
    try {
        const category = await createCategory(client);
        const post = await createBlogPost(client);
    } catch (error) {
        console.log('Error in create-content-model', error)
    }
}

module.exports = creatContentModel;