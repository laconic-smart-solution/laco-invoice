import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outDir = fileURLToPath(new URL("./templates/", import.meta.url));
const outFile = fileURLToPath(new URL("./templates/Laco_ERP_Master_and_Voucher_Template.xlsx", import.meta.url));

const palette = {
  red: "#D40000",
  redLight: "#FDE8E8",
  ink: "#17201F",
  muted: "#64716D",
  line: "#DCE4E0",
  white: "#FFFFFF",
  soft: "#F8F9F8",
  green: "#1D5147",
  amber: "#FFF4CC",
};

const masters = [
  {
    name: "Companies_Branches",
    title: "ERP companies and branches",
    subtitle: "Load this sheet first. Company and branch codes scope every other master-data sheet.",
    headers: ["erp_company_id", "company_code", "company_name", "erp_branch_id", "branch_code", "branch_name", "country_code", "currency_code", "active", "updated_at_utc", "notes"],
    widths: [18, 16, 32, 18, 16, 32, 14, 15, 12, 22, 28],
  },
  {
    name: "Items",
    title: "ERP items and products",
    subtitle: "Use the stable ERP item ID as the import match key. Do not use item name as an identifier.",
    headers: ["company_code", "branch_code", "erp_item_id", "erp_code", "item_name", "item_name_local", "item_type", "uom_code", "default_tax_code", "revenue_account_code", "expense_account_code", "inventory_account_code", "active", "updated_at_utc", "notes"],
    widths: [15, 15, 18, 18, 34, 34, 16, 14, 18, 22, 22, 22, 12, 22, 28],
  },
  {
    name: "Vendors",
    title: "ERP vendors and suppliers",
    subtitle: "One row per vendor in each ERP company. Keep tax IDs and addresses protected when sharing the file.",
    headers: ["company_code", "branch_code", "erp_vendor_id", "vendor_code", "vendor_name", "vendor_name_local", "tax_id", "address_line_1", "address_line_2", "city", "postal_code", "country_code", "payment_terms_code", "payable_account_code", "default_tax_code", "currency_code", "active", "updated_at_utc", "notes"],
    widths: [15, 15, 18, 18, 32, 32, 18, 32, 32, 20, 14, 14, 20, 22, 18, 15, 12, 22, 28],
  },
  {
    name: "GL_Accounts",
    title: "ERP GL account codes",
    subtitle: "Only active accounts should be available for new vouchers. Historical vouchers keep their original account snapshot.",
    headers: ["company_code", "erp_account_id", "account_code", "account_name", "account_name_local", "account_type", "normal_balance", "allow_debit", "allow_credit", "currency_code", "control_account", "active", "updated_at_utc", "notes"],
    widths: [15, 18, 18, 34, 34, 16, 16, 14, 14, 15, 18, 12, 22, 28],
  },
  {
    name: "Departments",
    title: "ERP departments and cost centres",
    subtitle: "Use parent department code to preserve the ERP hierarchy. Leave it blank for a root department.",
    headers: ["company_code", "erp_department_id", "department_code", "department_name", "department_name_local", "parent_department_code", "cost_centre_code", "manager_code", "active", "updated_at_utc", "notes"],
    widths: [15, 20, 20, 34, 34, 24, 20, 18, 12, 22, 28],
  },
  {
    name: "Tax_Codes",
    title: "ERP tax and withholding codes",
    subtitle: "Rates are percentages. Enter 7 for 7% VAT, not 0.07. Mark whether the code applies to input or output tax.",
    headers: ["company_code", "erp_tax_code_id", "tax_code", "tax_name", "tax_type", "vat_rate_percent", "wht_rate_percent", "input_or_output", "recoverable", "active", "effective_from", "effective_to", "updated_at_utc", "notes"],
    widths: [15, 18, 18, 30, 16, 18, 18, 18, 14, 12, 16, 16, 22, 28],
  },
  {
    name: "Currencies",
    title: "ERP currencies",
    subtitle: "Use ISO 4217 codes. The application currently defaults invoices and vouchers to THB.",
    headers: ["currency_code", "currency_name", "symbol", "decimal_places", "active", "updated_at_utc", "notes"],
    widths: [16, 28, 12, 18, 12, 22, 28],
  },
  {
    name: "Voucher_Mappings",
    title: "Laco to ERP voucher mappings",
    subtitle: "Maintain approved mappings after master data is loaded. Codes must exist on the master-data sheets.",
    headers: ["laco_store_code", "marketplace_code", "transaction_type", "erp_company_code", "erp_branch_code", "revenue_account_code", "receivable_account_code", "fee_account_code", "clearing_account_code", "default_vendor_code", "department_code", "tax_code", "currency_code", "active", "effective_from", "effective_to", "mapping_version", "notes"],
    widths: [18, 20, 24, 18, 18, 22, 22, 22, 22, 20, 20, 18, 15, 12, 16, 16, 18, 30],
  },
  {
    name: "Voucher_Lines",
    title: "Voucher import and export lines",
    subtitle: "One row per voucher line. Debit and credit must balance within each local voucher number before posting to ERP.",
    headers: ["source_batch_id", "source_document_type", "source_document_id", "local_voucher_number", "voucher_category", "voucher_date", "tax_month", "currency_code", "erp_company_code", "erp_branch_code", "erp_vendor_id", "vendor_code", "erp_item_id", "item_code", "erp_account_id", "account_code", "erp_department_id", "department_code", "tax_code", "description", "debit", "credit", "taxable_amount", "vat_amount", "reference_no", "erp_voucher_no", "line_status", "notes"],
    widths: [22, 22, 22, 24, 18, 16, 16, 15, 18, 18, 18, 18, 18, 18, 18, 18, 20, 20, 16, 42, 16, 16, 18, 16, 24, 22, 18, 28],
  },
];

function styleSheet(sheet) {
  sheet.showGridLines = false;
  sheet.tabColor = palette.red;
}

function columnLetter(index) {
  let value = index;
  let label = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

function writeSheet(sheet, config) {
  styleSheet(sheet);
  const endColumn = columnLetter(config.headers.length);
  const titleRange = sheet.getRange(`A1:${endColumn}1`);
  titleRange.merge();
  titleRange.values = [[config.title]];
  titleRange.format = { fill: palette.white, font: { name: "Arial", size: 16, bold: true, color: palette.ink }, verticalAlignment: "center" };
  titleRange.format.rowHeight = 28;
  const subRange = sheet.getRange(`A2:${endColumn}2`);
  subRange.merge();
  subRange.values = [[config.subtitle]];
  subRange.format = { font: { name: "Arial", size: 10, italic: true, color: palette.muted }, wrapText: true, verticalAlignment: "center" };
  subRange.format.rowHeight = 32;
  sheet.getRange(`A4:${endColumn}4`).values = [[...config.headers]];
  const header = sheet.getRange(`A4:${endColumn}4`);
  header.format = { fill: palette.red, font: { name: "Arial", size: 10, bold: true, color: palette.white }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: palette.white } };
  header.format.rowHeight = 32;
  const rowCount = 200;
  const body = sheet.getRangeByIndexes(4, 0, rowCount, config.headers.length);
  body.format = { font: { name: "Arial", size: 10, color: palette.ink }, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: palette.line } };
  for (let i = 0; i < config.widths.length; i += 1) sheet.getCell(0, i).format.columnWidth = config.widths[i];
  sheet.freezePanes.freezeRows(4);
  const activeColumn = config.headers.indexOf("active");
  if (activeColumn >= 0) sheet.getRangeByIndexes(4, activeColumn, rowCount, 1).dataValidation = { rule: { type: "list", values: ["YES", "NO"] } };
  const dateColumns = config.headers.map((h, i) => ({ h, i })).filter(({ h }) => h.includes("date") || h.endsWith("_utc") || h.startsWith("effective_"));
  for (const { i } of dateColumns) sheet.getRangeByIndexes(4, i, rowCount, 1).format.numberFormat = "yyyy-mm-dd";
  const decimalColumns = config.headers.map((h, i) => ({ h, i })).filter(({ h }) => ["debit", "credit", "taxable_amount", "vat_amount", "vat_rate_percent", "wht_rate_percent"].includes(h));
  for (const { i } of decimalColumns) sheet.getRangeByIndexes(4, i, rowCount, 1).format.numberFormat = "0.00";
  return sheet;
}

const workbook = Workbook.create();
const guide = workbook.worksheets.add("Start_Here");
styleSheet(guide);
guide.getRange("A1:H1").merge();
guide.getRange("A1").values = [["Laco Invoice ERP master-data and voucher template"]];
guide.getRange("A1:H1").format = { font: { name: "Arial", size: 16, bold: true, color: palette.ink }, verticalAlignment: "center" };
guide.getRange("A1:H1").format.rowHeight = 30;
guide.getRange("A2:H2").merge();
guide.getRange("A2").values = [["Version 1.0  |  Import ERP master data locally, then prepare voucher lines without calling ERP for every action."]];
guide.getRange("A2:H2").format = { font: { name: "Arial", size: 10, italic: true, color: palette.muted }, verticalAlignment: "center" };
guide.getRange("A4:B4").values = [["Sheet", "Purpose"]];
guide.getRange("A4:B4").format = { fill: palette.red, font: { name: "Arial", size: 10, bold: true, color: palette.white }, borders: { preset: "all", style: "thin", color: palette.white } };
const guideRows = [
  ["Companies_Branches", "Load company and branch scope before other master data."],
  ["Items", "ERP item and product records used by voucher lines."],
  ["Vendors", "ERP supplier records for AP and payment vouchers."],
  ["GL_Accounts", "Chart of accounts used for debit and credit entries."],
  ["Departments", "Departments and cost centres used for allocation."],
  ["Tax_Codes", "VAT and withholding tax codes and rates."],
  ["Currencies", "ISO currency codes and decimal rules."],
  ["Voucher_Mappings", "Approved mappings from Laco transactions to ERP accounts."],
  ["Voucher_Lines", "Import-ready or export-ready voucher-line format."],
];
guide.getRangeByIndexes(4, 0, guideRows.length, 2).values = guideRows;
guide.getRange("A5:B13").format = { font: { name: "Arial", size: 10, color: palette.ink }, wrapText: true, verticalAlignment: "center", borders: { preset: "all", style: "thin", color: palette.line } };
guide.getRange("D4:H4").merge();
guide.getRange("D4").values = [["Import rules"]];
guide.getRange("D4:H4").format = { fill: palette.green, font: { name: "Arial", size: 10, bold: true, color: palette.white } };
const rules = [
  ["1", "Use UTF-8 CSV or this XLSX workbook. Do not rename headers or change the template version."],
  ["2", "Use external ERP IDs as stable identifiers. Codes and names can change; IDs must not."],
  ["3", "Enter dates as YYYY-MM-DD, numeric amounts without thousands separators, and YES/NO for active fields."],
  ["4", "Review validation errors before importing. Never delete master records already referenced by vouchers; set active to NO instead."],
  ["5", "For Voucher_Lines, debit must equal credit for each local voucher number before ERP import or posting."],
];
guide.getRangeByIndexes(4, 3, rules.length, 2).values = rules;
guide.getRange("D5:E9").format = { font: { name: "Arial", size: 10, color: palette.ink }, wrapText: true, verticalAlignment: "top", borders: { preset: "all", style: "thin", color: palette.line } };
guide.getRange("D5:D9").format.fill = palette.redLight;
guide.getRange("A15:H15").merge();
guide.getRange("A15").values = [["Template fields follow docs/ERP_INTEGRATION_PLAN.md. Remove blank rows only if your ERP import tool requires a compact file."]];
guide.getRange("A15:H15").format = { fill: palette.amber, font: { name: "Arial", size: 10, color: palette.ink }, wrapText: true };
guide.getRange("A1:H16").format.font = { name: "Arial" };
guide.getRange("A:A").format.columnWidth = 24;
guide.getRange("B:B").format.columnWidth = 50;
guide.getRange("C:C").format.columnWidth = 4;
guide.getRange("D:D").format.columnWidth = 8;
guide.getRange("E:E").format.columnWidth = 62;
guide.freezePanes.freezeRows(4);

for (const config of masters) writeSheet(workbook.worksheets.add(config.name), config);

await fs.mkdir(outDir, { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outFile);

const inspection = await workbook.inspect({ kind: "workbook,sheet,table", maxChars: 6000, tableMaxRows: 4, tableMaxCols: 8 });
console.log(inspection.ndjson);
const preview = await workbook.render({ sheetName: "Start_Here", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(new URL("./templates/Laco_ERP_Master_and_Voucher_Template_preview.png", import.meta.url), new Uint8Array(await preview.arrayBuffer()));
for (const { name } of masters) {
  await workbook.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
  console.log(`Rendered ${name}`);
}
