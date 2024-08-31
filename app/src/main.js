import { Actor } from 'apify';
import path from 'path';
import { CheerioCrawler } from 'crawlee';
import SupabaseClient from '../utils/supabase.js';
import { isValidUrl, isInScope } from '../utils/request.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    await Actor.init();

    const input = await Actor.getInput();
    const {
        spiderName,
        startUrls = [],
        concurrency = 1,
        userDatabase = true,
        scope
    } = input ?? {};

    if (!spiderName) {
        throw new Error('Spider name must be provided using --spiderName.');
    }

    if (!scope) {
        throw new Error('Scope must be provided.');
    }

    const spiderPath = path.join(__dirname, spiderName, 'src', 'routes', 'spider.js');
    const {router} = await import(spiderPath);
    
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
        process.exit(1);
    } finally {
        await Actor.exit();
    }
})();