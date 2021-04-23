
function storeCategory(environment, wpData) {
    let categories = wpData.categories;

    categories.map((asset, index) => {
        setTimeout(() => {
            try {
                environment.createEntryWithId('category', asset.slug,{
                    fields: {
                        name: {
                            'en-US': asset.name
                        },
                        slug: {
                            'en-US': asset.slug
                        }
                    }
                })
                .then((entry) => entry.publish())
            } catch (error) {
                throw(Error(error));
            }
        }, 8000);
    });
}

async function creatContentfulCategory(environment, wpData) {
    try {
        await storeCategory(environment, wpData);
    } catch (error) {
        console.log('Error in create-contentful-category', error)
    }
}

module.exports = creatContentfulCategory;