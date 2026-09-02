import { chromium } from "playwright"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RESULTS = path.join(__dirname, "results")
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5173"
const EMAIL = process.env.E2E_EMAIL || "admin@gmail.com"
const PASSWORD = process.env.E2E_PASSWORD || "12345"
const RUN_IDS = (process.env.E2E_RUN_IDS || "51,52,53,54,55,56,57,58,59,60")
  .split(",")
  .map((id) => Number(id.trim()))
  .filter((id) => Number.isFinite(id) && id > 0)

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

async function runFile(page, id) {
  await page.goto(`${BASE_URL}/orders/inputs/${id}`, {
    waitUntil: "domcontentloaded",
  })
  await page.getByText("Invoice PDF").first().waitFor({ timeout: 20000 })

  const title = (await page.locator("h1, h2").first().innerText().catch(() => "")) || `run ${id}`
  const runBtn = page.getByRole("button", { name: "Run file" }).first()
  if (await runBtn.isDisabled()) {
    await page.screenshot({
      path: path.join(RESULTS, `run-${id}-disabled.png`),
      fullPage: true,
    })
    return {
      id,
      title,
      pass: false,
      detail: "Run file is disabled",
      url: page.url(),
    }
  }

  await runBtn.click()

  const confirm = page.getByRole("button", { name: "Confirm import" })
  try {
    await confirm.waitFor({ timeout: 60000 })
  } catch {
    const body = await page.locator("body").innerText()
    await page.screenshot({
      path: path.join(RESULTS, `run-${id}-no-preview.png`),
      fullPage: true,
    })
    return {
      id,
      title,
      pass: false,
      detail: body.slice(0, 400),
      url: page.url(),
    }
  }

  await page.waitForTimeout(1500)
  await confirm.click()

  try {
    await confirm.waitFor({ state: "hidden", timeout: 90000 })
  } catch {
    const body = await page.locator("body").innerText()
    await page.screenshot({
      path: path.join(RESULTS, `run-${id}-commit-stuck.png`),
      fullPage: true,
    })
    return {
      id,
      title,
      pass: false,
      detail: body.slice(0, 400),
      url: page.url(),
    }
  }

  await page.waitForTimeout(2500)
  const bodyText = await page.locator("body").innerText()
  const completed = /completed/i.test(bodyText) || /succeeded/i.test(bodyText)
  await page.screenshot({
    path: path.join(RESULTS, `run-${id}-${completed ? "ok" : "after"}.png`),
    fullPage: true,
  })
  return {
    id,
    title,
    pass: completed,
    detail: completed ? "Imported" : "Preview closed but status unclear",
    url: page.url(),
  }
}

async function main() {
  fs.mkdirSync(RESULTS, { recursive: true })
  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
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
    for (const id of RUN_IDS) {
      const result = await runFile(page, id)
      results.push(result)
      console.log(
        `${result.pass ? "PASS" : "FAIL"}  run ${result.id}  ${result.detail}`
      )
    }
    await page.goto(`${BASE_URL}/orders/inputs`)
    await page.waitForTimeout(20000)
  } finally {
    await browser.close()
  }

  const summary = {
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    results,
  }
  fs.writeFileSync(
    path.join(RESULTS, "run-files-summary.json"),
    JSON.stringify(summary, null, 2)
  )
  console.log(`\n${summary.passed} passed, ${summary.failed} failed / ${results.length}`)
  if (summary.failed > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
