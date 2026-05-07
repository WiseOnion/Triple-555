const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const PAGES = [
  { file: 'index.html',      name: '01-home' },
  { file: 'about.html',      name: '02-about' },
  { file: 'membership.html', name: '03-membership' },
  { file: 'events.html',     name: '04-events' },
  { file: 'donate.html',     name: '05-donate' },
  { file: 'contact.html',    name: '06-contact' },
  { file: 'gallery.html',    name: '07-gallery' },
  { file: 'scholarship.html',name: '08-scholarship' },
  { file: 'tributes.html',   name: '09-tributes' },
  { file: 'resources.html',  name: '10-resources' },
  { file: 'blog.html',       name: '11-blog' },
];

const SITE_DIR = path.resolve(__dirname, 'current');
const OUT_DIR  = path.resolve(__dirname, 'screenshots');

// CSS injected into every page before screenshotting:
//  - kills all CSS transitions, animations, and scroll-behavior
//  - un-sticks the nav so it doesn't float over content in the screenshot
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
  /* Un-stick the header so it doesn't overlap page content */
  header, nav, .nav-wrapper, [class*="header"], [class*="navbar"] {
    position: static !important;
    top: auto !important;
  }
`;

async function screenshotPage(browser, fileRelPath, outName) {
  const url  = `file:///${path.join(SITE_DIR, fileRelPath).replace(/\\/g, '/')}`;
  const page = await browser.newPage();

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // Disable all animations via the prefers-reduced-motion media feature
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // Inject freeze CSS
  await page.addStyleTag({ content: FREEZE_CSS });

  // Let lazy-load / JS settle for a tick after style injection
  await new Promise(r => setTimeout(r, 500));

  // Scroll slowly to the bottom so lazy images load, then back to top
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let y = 0;
      const step = 400;
      const id = setInterval(() => {
        window.scrollBy(0, step);
        y += step;
        if (y >= document.body.scrollHeight) {
          window.scrollTo(0, 0);
          clearInterval(id);
          resolve();
        }
      }, 80);
    });
  });

  // Short pause after scroll-back so images finish painting
  await new Promise(r => setTimeout(r, 400));

  const outFile = path.join(OUT_DIR, `${outName}.png`);
  await page.screenshot({ path: outFile, fullPage: true });
  await page.close();
  console.log(`  saved → ${outFile}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Launching browser…');
  const browser = await puppeteer.launch({ headless: true });

  for (const { file, name } of PAGES) {
    console.log(`Capturing ${file}…`);
    try {
      await screenshotPage(browser, file, name);
    } catch (err) {
      console.error(`  ERROR on ${file}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to:', OUT_DIR);
})();
