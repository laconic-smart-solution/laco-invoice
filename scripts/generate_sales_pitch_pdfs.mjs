import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(path.join(__dirname, '../client/package.json'));
const { chromium } = require('playwright');

const docsDir = path.resolve(__dirname, '../docs');

const jobs = [
  {
    html: path.join(docsDir, 'Laco-Invoice-Sales-Pitch.html'),
    pdf: path.join(docsDir, 'Laco-Invoice-Sales-Pitch.pdf')
  },
  {
    html: path.join(docsDir, 'Laco-Invoice-Sales-Pamphlet.html'),
    pdf: path.join(docsDir, 'Laco-Invoice-Sales-Pamphlet.pdf')
  }
];

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });

  for (const job of jobs) {
    console.log(`Generating PDF for ${path.basename(job.html)} -> ${path.basename(job.pdf)}...`);
    const page = await browser.newPage();
    const fileUrl = `file://${job.html.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    await page.pdf({
      path: job.pdf,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    console.log(`Successfully generated ${job.pdf}`);
    await page.close();
  }

  await browser.close();
  console.log('All PDFs generated successfully.');
}

run().catch((err) => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
