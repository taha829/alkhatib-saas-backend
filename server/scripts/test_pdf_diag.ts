
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Mirroring the logic from appointmentController.ts
const findBrowserPath = () => {
    const paths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) {
            console.log(`[Found] ${p}`);
            return p;
        } else {
            console.log(`[Missing] ${p}`);
        }
    }
    return null;
};

async function testLaunch() {
    try {
        const browserPath = findBrowserPath();
        console.log(`[Result] Selected Browser Path: ${browserPath || 'Puppeteer Bundled'}`);

        console.log('Attempting to launch browser...');
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: browserPath || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Browser launched successfully!');

        const page = await browser.newPage();
        await page.setContent('<h1>Test PDF</h1>');
        const pdfBuffer = await page.pdf({ format: 'A4' });
        console.log(`PDF generated successfully. Size: ${pdfBuffer.length} bytes`);

        await browser.close();
        console.log('Browser closed.');
    } catch (error: any) {
        console.error('CRITICAL FAILURE:', error);
    }
}

testLaunch();
