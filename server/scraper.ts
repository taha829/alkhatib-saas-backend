import puppeteer from 'puppeteer';

export interface ExtractedContact {
    name: string;
    profile_url?: string;
    phone?: string;
    email?: string;
    context?: string;
}

export interface ScrapeResult {
    title: string;
    description: string;
    url: string;
    content?: string;
    screenshot?: string;
    platform?: string;
    email?: string;
    job_title?: string;
    location?: string;
    keywords?: string;
    contacts: ExtractedContact[];
}

async function autoScroll(page: any) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight || totalHeight > 5000) { // Increased limit
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
    console.log(`[Scraper] Launching browser for: ${url}`);

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

        // Use a real-looking user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Scroll to load dynamic content (posts/comments)
        await autoScroll(page);

        // Wait for some potential dynamic updates
        await new Promise(r => setTimeout(r, 3000)); // Wait for lazy load

        const data = await page.evaluate(() => {
            const titleEl = document.querySelector('meta[name="title"]') || document.querySelector('meta[property="og:title"]');
            const title = document.title || (titleEl ? titleEl.getAttribute('content') : '') || '';

            // Identify platform from URL
            const hostname = window.location.hostname;
            let platform = 'Unknown';
            if (hostname.includes('facebook')) platform = 'Facebook';
            else if (hostname.includes('instagram')) platform = 'Instagram';
            else if (hostname.includes('twitter') || hostname.includes('x.com')) platform = 'Twitter';
            else if (hostname.includes('linkedin')) platform = 'LinkedIn';
            else if (hostname.includes('youtube')) platform = 'YouTube';
            else if (hostname.includes('google') && hostname.includes('maps')) platform = 'Google Maps';
            else if (hostname.includes('opensooq')) platform = 'OpenSooq';
            else if (hostname.includes('yellowpages')) platform = 'Yellow Pages';

            const bodyText = document.body.innerText || '';
            const contacts: any[] = [];
            const uniqueProfiles = new Set();

            if (platform === 'Facebook') {
                // Heuristic for Facebook Comments/Posters
                // Look for links that look like user profiles
                const links = Array.from(document.querySelectorAll('a'));
                links.forEach(a => {
                    const href = a.href;
                    // Filter for profile links (this is approximate)
                    // Exclude irrelevant FB links
                    if (href.includes('facebook.com') &&
                        !href.includes('/groups/') &&
                        !href.includes('/share') &&
                        !href.includes('/messages/') &&
                        !href.includes('/watch') &&
                        !href.includes('/photo') &&
                        !href.includes('/l.php')) {

                        // Valid profile links usually have specific patterns
                        // But simplification: any link with decent text might be a name
                        const name = a.innerText.trim();
                        if (name.length > 2 && name.length < 50 && !uniqueProfiles.has(href)) {
                            // Start filling contact
                            // Try to find context (parent text)
                            let context = '';
                            let parent = a.parentElement;
                            let depth = 0;
                            // Go up a few levels to find the comment block text
                            while (parent && depth < 4) {
                                if (parent.innerText.length > name.length + 10) {
                                    context = parent.innerText.replace(name, '').trim().substring(0, 200);
                                    break;
                                }
                                parent = parent.parentElement;
                                depth++;
                            }

                            // Try extract phone/email from the context
                            const phoneMatch = context.match(/(?:\+|00)\d{1,3}[\s-]?\d{4,12}|\b07[7895]\d{7}\b/);
                            const emailMatch = context.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

                            contacts.push({
                                name: name,
                                profile_url: href,
                                phone: phoneMatch ? phoneMatch[0] : undefined,
                                email: emailMatch ? emailMatch[0] : undefined,
                                context: context
                            });
                            uniqueProfiles.add(href);
                        }
                    }
                });
            } else {
                // General Web Extraction (Google results, business sites, etc.)
                const phoneRegex = /(?:\+?(\d{1,3}))?[-. (]*(01[0125]|05\d|09\d)[-. )]*(\d{7,8})|(?:\+|00)\d{1,3}[\s-]?\d{4,12}|\b07[7895]\d{7}\b/g;
                const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

                const foundPhones = [...new Set(bodyText.match(phoneRegex) || [])];
                const foundEmails = [...new Set(bodyText.match(emailRegex) || [])];

                if (foundPhones.length > 0 || foundEmails.length > 0) {
                    contacts.push({
                        name: title || 'Business Contact',
                        phone: foundPhones[0],
                        email: foundEmails[0],
                        context: bodyText.substring(0, 500) // First 500 chars as context
                    });

                    // Add secondary contacts if many phones found
                    for (let i = 1; i < Math.min(foundPhones.length, 5); i++) {
                        contacts.push({
                            name: `${title || 'Business'} (Alt ${i})`,
                            phone: foundPhones[i],
                            context: 'Additional number found on page'
                        });
                    }
                }
            }

            // const descEl = document.querySelector('meta[name="description"]') || document.querySelector('meta[property="og:description"]');
            // const description = (descEl ? descEl.getAttribute('content') : '') || '';

            // const kwEl = document.querySelector('meta[name="keywords"]');
            // const keywords = (kwEl ? kwEl.getAttribute('content') : '') || '';

            return {
                title,
                description: '',
                content: bodyText,
                platform,
                contacts,
                // Legacy fields for backward compatibility
                email: '',
                job_title: '',
                location: '',
                keywords: ''
            };
        });

        const screenshotBuffer = await page.screenshot({ encoding: 'base64', fullPage: false });

        console.log(`[Scraper] Found ${data.contacts.length} structured contacts.`);

        return {
            ...data,
            url,
            screenshot: screenshotBuffer as string
        };

    } catch (error) {
        console.error('[Scraper] Error:', error);
        throw error;
    } finally {
        await browser.close();
    }
}
