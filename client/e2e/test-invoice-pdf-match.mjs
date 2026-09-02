import { chromium } from "playwright"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, "fixtures", "invoice-match")
const RESULTS = path.join(__dirname, "results")
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5173"
const EMAIL = process.env.E2E_EMAIL || "admin@gmail.com"
const PASSWORD = process.env.E2E_PASSWORD || "12345"

function loadManifest() {
  const raw = fs.readFileSync(path.join(FIXTURES, "manifest.json"), "utf8")
  return JSON.parse(raw)
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" })
  if (!page.url().includes("/login")) {
    return
  }
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole("button", { name: "Login" }).click()
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30000,
  })
  if (page.url().includes("otp")) {
    throw new Error(`Login requires OTP at ${page.url()}`)
  }
}

async function ensureStoreSelected(page) {
  const trigger = page.getByRole("combobox").first()
  const current = (await trigger.textContent())?.trim() ?? ""
  if (current && current !== "Select store") {
    return
  }
  await trigger.click()
  const option = page.getByRole("option").first()
  await option.waitFor({ timeout: 10000 })
  await option.click()
}

function normalizeMoney(value) {
  if (!value) return null
  const n = Number(String(value).replace(/,/g, ""))
  return Number.isFinite(n) ? n.toFixed(2) : null
}

function detectStatus(bodyText, pdfAmount, excelAmount) {
  const text = bodyText.replace(/\s+/g, " ")
  if (/amount mismatch/i.test(text)) return "MISMATCH"
  if (/not matched yet/i.test(text)) return "MISSING"
  if (/could not parse/i.test(text)) return "UNPARSED"
  if (/\bmatched\b/i.test(text)) return "MATCHED"
  const pdf = normalizeMoney(pdfAmount)
  const excel = normalizeMoney(excelAmount)
  if (pdf && excel && pdf === excel) return "MATCHED"
  if (pdf && excel && pdf !== excel) return "MISMATCH"
  return "UNKNOWN"
}

async function createAndMatch(page, caseItem, index) {
  const pdfPath = path.join(FIXTURES, caseItem.pdf)
  const excelPath = path.join(FIXTURES, caseItem.excel)

  await page.goto(`${BASE_URL}/orders/inputs`, { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "New data input" }).click()
  await page.getByRole("heading", { name: "New order data input" }).waitFor()

  await page.locator("#order-input-title").fill(caseItem.title)
  await ensureStoreSelected(page)

  const dialog = page.getByRole("dialog")
  await dialog.locator('input[accept="application/pdf,.pdf"]').setInputFiles(pdfPath)
  await dialog.locator('input[accept=".xlsx,.xls,.csv"]').setInputFiles(excelPath)
  await page.waitForTimeout(800)

  await page.getByRole("button", { name: "Create" }).click()

  const errorLocator = dialog.locator(".text-destructive, [class*='destructive']").first()
  const navigated = page
    .waitForURL(/\/orders\/inputs\/\d+/, { timeout: 90000 })
    .then(() => "ok")
    .catch(() => "timeout")

  const outcome = await navigated
  if (outcome !== "ok") {
    const dialogError = (await errorLocator.textContent().catch(() => ""))?.trim()
    await page.screenshot({
      path: path.join(RESULTS, `${caseItem.id}-create-failed.png`),
      fullPage: true,
    })
    return {
      id: caseItem.id,
      title: caseItem.title,
      expect: caseItem.expect,
      actual: "CREATE_FAILED",
      pass: false,
      detail: dialogError || page.url(),
    }
  }

  await page.getByText("Invoice PDF").first().waitFor({ timeout: 15000 })
  await page.waitForTimeout(4000)
  const bodyText = await page.locator("body").innerText()
  const pdfAmountMatch = bodyText.match(/PDF amount[\s\S]{0,80}?([\d,]+\.\d{2})/i)
  const excelAmountMatch = bodyText.match(/Excel amount[\s\S]{0,80}?([\d,]+\.\d{2})/i)
  const actual = detectStatus(
    bodyText,
    pdfAmountMatch?.[1],
    excelAmountMatch?.[1]
  )

  await page.screenshot({
    path: path.join(RESULTS, `${caseItem.id}-${actual}.png`),
    fullPage: true,
  })

  return {
    id: caseItem.id,
    title: caseItem.title,
    expect: caseItem.expect,
    actual,
    pass: actual === caseItem.expect,
    url: page.url(),
    pdfAmount: pdfAmountMatch?.[1] ?? null,
    excelAmount: excelAmountMatch?.[1] ?? null,
    expectedPdf: caseItem.pdfTotal,
    expectedExcel: caseItem.excelTotal,
    index,
  }
}

async function main() {
  fs.mkdirSync(RESULTS, { recursive: true })
  const manifest = loadManifest()
  const browser = await chromium.launch({
    headless: false,
    slowMo: 450,
    args: ["--start-maximized"],
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    ignoreHTTPSErrors: true,
  })
  const page = await context.newPage()
  page.setDefaultTimeout(20000)

  const results = []
  try {
    await login(page)
    await page.goto(`${BASE_URL}/orders/inputs`)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(RESULTS, "00-after-login.png"), fullPage: true })

    for (let i = 0; i < manifest.length; i += 1) {
      const result = await createAndMatch(page, manifest[i], i + 1)
      results.push(result)
      console.log(
        `${result.pass ? "PASS" : "FAIL"}  ${result.id} expect=${result.expect} actual=${result.actual} ${result.detail ?? result.url ?? ""}`
      )
    }

    await page.goto(`${BASE_URL}/orders/inputs`)
    await page.waitForTimeout(90000)
  } finally {
    await browser.close()
  }

  const summary = {
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    results,
  }
  fs.writeFileSync(path.join(RESULTS, "summary.json"), JSON.stringify(summary, null, 2))
  console.log(`\n${summary.passed} passed, ${summary.failed} failed / ${results.length}`)
  if (summary.failed > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
