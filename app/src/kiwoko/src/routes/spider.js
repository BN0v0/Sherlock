import { Dataset, log } from 'crawlee';
import { extractIngredients, extractAnalyticalComponents, extractKeyFeatures, safeGet, extractPricing, createDetailedTime } from '../libs/index.js'

const sitemapHandler = async ctx => {
    const { $, request } = ctx;

    const links = $('url loc').map((_, el) => $(el).text().trim()).get();

    ctx.addRequests(links);
}

const homePageHandler = async ctx => {
    const { $, request } = ctx;

    const menuLinks = $('li.mega-toggle > ul > li.is-link > a[href]')
        .map((_, el) => $(el).attr('href'))
        .get();

    ctx.addRequests(menuLinks);
};

const batchPageHandler = async ctx => {
    const { $, request } = ctx;

    const url = new URL(request.url);

    if(!url.searchParams.get('page') && !url.searchParams.get('start')){
        const productsPerPage = 24;

        const totalCountString = $('div.result-count span').text();
        
        if(!totalCountString) throw new Error(`Unable to get total product count. (request = ${url})`);

        const {count} = totalCountString.replace('\n', '').match(/(?<count>\d+)\s*Resultados/)?.groups;
        const totalCount = parseInt(count, 10);
        const pageTotal = Math.ceil(totalCount/productsPerPage);

        const requests = [];
        for (let index = 2; index < pageTotal; index++) {
            url.searchParams.set('page', index);
            url.searchParams.set('start', productsPerPage * (index -1 ));
            requests.push(url.href);
        }

        ctx.addRequests(requests);
    }

    const productLinks = $('a.js-product-tile-anchor.kwk-product-card__image-content[href]')
        .map((_, el) => $(el).attr('href'))
        .get();

    ctx.addRequests(productLinks);
};

const productPageHandler = async (ctx) => {
    const { $, request } = ctx;

    try {
        // Extract options
        const urls = $('input.js-isk-radio-button-modal')
            .map((_, el) => {
                const value = $(el).val();
                // Ensure the value is a string and not empty
                return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
            })
            .get()
            .filter(Boolean); // Remove any null values

        if (urls.length === 0) {
            log.warning(`No valid options found on page ${request.url}`);
            return;
        }

        // Add the requests
        await ctx.addRequests(urls);

    } catch (error) {
        log.error(`Error processing product page ${request.url}`, { error: error.message });
    }
};

export default productPageHandler;

const productJsonHandler = async (ctx) => {
    const { json, request } = ctx;
    try {      
      // Validate that json.product exists
      if (!json.product) {
        throw new Error('Invalid JSON structure: product not found');
      }
  
      const product = json.product;

      const pricing = extractPricing(product);
    const time = createDetailedTime();

    const extractedData = {
        id: safeGet(product, 'id'),
        ean: safeGet(product, 'ean'),
        name: safeGet(product, 'productNameWithoutName'),
        brand: safeGet(product, 'brand'),
        url: safeGet(product, 'productPageURL'),
        requestUrl: request.url,
        pricing,
        contents: safeGet(product, 'variationAttributes.0.displayValue'),
        categories: safeGet(product, 'itemCategory', '').split('-').filter(Boolean),
        promotions: Array.isArray(product.promotions) 
        ? product.promotions.map(promo => ({
            callout: safeGet(promo, 'calloutMsg'),
            details: safeGet(promo, 'details')
            }))
        : [],
        ingredients: extractIngredients(safeGet(product, 'longDescription', '')),
        analyticalComponents: extractAnalyticalComponents(safeGet(product, 'longDescription', '')),
        keyFeatures: extractKeyFeatures(safeGet(product, 'longDescription', '')),
        time,
    };
  
      // Push the extracted data to the dataset
      await Dataset.pushData(extractedData);
  
      log.info('Product data extracted and pushed to dataset:', { id: extractedData.id, url: extractedData.url });
    } catch (error) {
      log.error('Error processing product JSON:', { url: request.url, error: error.message });
    }
};

// Classification Handler
export const router = async ctx => {
    const { json, $, request } = ctx;
    
    if(json){
        await productJsonHandler(ctx);
    }
    else if ($ && $('url loc').length > 0) {
        await sitemapHandler(ctx);
    } else if ($ && $('div.home-promo').length > 0){
       await homePageHandler(ctx);
    } else if ($ && $('div#product-search-results').length > 0) {
       await batchPageHandler(ctx);
    } else if ($ && $('div[data-action="Product-Show"]').length > 0){
        await productPageHandler(ctx);
    } else {
        log.warning(`Unable to classify this resource. (request = ${request.url})`);
    }
};