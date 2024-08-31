import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';
import router from './routes/index.js';
import SupabaseClient from '../../../utils/supabase.js';
import { isValidUrl, isInScope } from '../../../utils/request.js';

async function main() {
    await Actor.init();

    const input = await Actor.getInput();
    const {
        startUrls = [],
        concurrency = 1,
        userDatabase = true,
        scope = 'https://www.kiwoko.pt/.*'
    } = input ?? {};

    const scopeRegex = new RegExp(scope);

    const proxyConfiguration = await Actor.createProxyConfiguration();

    const crawler = new CheerioCrawler({
        proxyConfiguration,
        requestHandler: router,
        maxConcurrency: concurrency,
    });

    if (userDatabase) {
        await addUrlsFromDatabase(startUrls, scopeRegex);
    }

    await crawler.run(startUrls);
}

async function addUrlsFromDatabase(startUrls, scopeRegex) {
    try {
        const dbClient = new SupabaseClient();
        const databaseList = await dbClient.fetchData(process.env.SUPABASE_PRODUCT_TABLE);
        
        for (const element of databaseList) {
            if (!isValidUrl(element.value)) {
                console.warn(`Request ignored due to invalid URL: ${element.value}`);
                continue;
            }
            if (!isInScope(element.value, scopeRegex)) {
                console.warn(`Request ignored due to being out of scope: ${element.value}`);
                continue;
            }
            startUrls.push(element.value);
        }
        
        console.log('URLs added from database:', startUrls.length);
    } catch (error) {
        console.error('Error fetching data from database:', error);
    }
}

(async () => {
    try {
        await main();
    } catch (error) {
        console.error('Actor failed:', error);
    } finally {
        await Actor.exit();
    }
})();