import puppeteer, { Page } from 'puppeteer';

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    platform: string;
}

export async function searchGoogle(keyword: string, location: string, platform: string): Promise<SearchResult[]> {
    console.log(`[SearchEngine] Starting search for: ${keyword} in ${location} on ${platform}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Advanced Stealth: Remove webdriver property
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        });

        // Set realistic headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        });

        // Randomize user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Construct clever Google Dork
        let siteOperator = '';
        if (platform === 'facebook') siteOperator = 'site:facebook.com';
        else if (platform === 'linkedin') siteOperator = 'site:linkedin.com/in';
        else if (platform === 'instagram') siteOperator = 'site:instagram.com';
        else if (platform === 'twitter') siteOperator = 'site:twitter.com';
        else if (platform === 'google') siteOperator = ''; // Business search on web
        else if (platform === 'all') siteOperator = ''; // Open search

        const query = platform === 'google'
            ? `"${keyword}" "${location}" (اتصل بنا | هاتف | تليفون | "contact us" | phone)`
            : `${siteOperator} "${keyword}" "${location}" -intitle:"profiles" -intitle:"jobs"`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`; // Get up to 20 results (approx 2 pages worth)

        console.log(`[SearchEngine] Navigating to: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Bypass "Before you continue" or Captcha check (basic)
        const isConsent = await page.$('button[aria-label="Accept all"]');
        if (isConsent) await isConsent.click();

        // Extract Valid Results
        const results = await page.evaluate((targetPlatform) => {
            // Google uses multiple classes for result containers
            const items = document.querySelectorAll('.g, .tF2Cxc, .MjjYud');
            const extracted: any[] = [];

            console.log(`[Eval] Found ${items.length} potential items`);

            items.forEach((item) => {
                const titleEl = item.querySelector('h3');
                const linkEl = item.querySelector('a');
                // Snippet classes change often, try multiple
                const snippetEl = item.querySelector('.VwiC3b, .yXK7H, .MUF9Of, .p6409b');

                if (titleEl && linkEl) {
                    const title = titleEl.textContent || '';
                    const url = linkEl.href;
                    const snippet = snippetEl ? (snippetEl as HTMLElement).innerText : '';

                    // Filter out garbage urls and ensure it's a real result
                    if (url && url.startsWith('http') && !url.includes('google.com/search')) {
                        extracted.push({
                            title: title.trim(),
                            url,
                            snippet: snippet.trim(),
                            platform: targetPlatform
                        });
                    }
                }
            });
            return extracted;
        }, platform);

        if (results.length === 0) {
            console.log('[SearchEngine] Google blocked or no results. Trying DuckDuckGo fallback...');
            return await searchDuckDuckGo(page, keyword, location, platform);
        }

        console.log(`[SearchEngine] Found ${results.length} basic results from Google.`);
        return results;

    } catch (error) {
        console.error('[SearchEngine] Error:', error);
        return [];
    } finally {
        await browser.close();
    }
}

async function searchDuckDuckGo(page: Page, keyword: string, location: string, platform: string): Promise<SearchResult[]> {
    try {
        let siteOperator = '';
        if (platform === 'facebook') siteOperator = 'site:facebook.com';
        else if (platform === 'linkedin') siteOperator = 'site:linkedin.com/in';
        else if (platform === 'instagram') siteOperator = 'site:instagram.com';
        else if (platform === 'twitter') siteOperator = 'site:twitter.com';

        const query = `${siteOperator} "${keyword}" "${location}"`;
        const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`; // Use HTML version for easier scraping

        console.log(`[SearchEngine] DDG Navigating to: ${ddgUrl}`);
        await page.goto(ddgUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        const results = await page.evaluate((targetPlatform) => {
            const items = document.querySelectorAll('.result');
            const extracted: any[] = [];

            items.forEach((item) => {
                const titleEl = item.querySelector('.result__a');
                const snippetEl = item.querySelector('.result__snippet');

                if (titleEl) {
                    const title = (titleEl as HTMLElement).innerText;
                    const url = (titleEl as HTMLAnchorElement).href;
                    const snippet = snippetEl ? (snippetEl as HTMLElement).innerText : '';

                    if (url && url.startsWith('http')) {
                        extracted.push({
                            title: title.trim(),
                            url,
                            snippet: snippet.trim(),
                            platform: targetPlatform
                        });
                    }
                }
            });
            return extracted;
        }, platform);

        console.log(`[SearchEngine] Found ${results.length} results from DuckDuckGo.`);
        return results;
    } catch (e) {
        console.error('[SearchEngine] DDG Fallback failed:', e);
        return [];
    }
}
