import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Layers,
  Menu,
  Minus,
  PackageCheck,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import { useEffect, useId, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { NavbarLanguageToggle } from "@/components/core/navbar/navbar-language-toggle"
import { marketingCopy } from "@/features/marketing/pages/marketing-copy"
import "@/features/marketing/pages/marketing-page.css"
import { useLocaleStore } from "@/shared/stores/locale-store"

const plans = [
  {
    name: "Starter",
    monthly: 990,
    storeLimit: 1,
    invoiceLimit: 300,
  },
  {
    name: "Growth",
    monthly: 2490,
    featured: true,
    storeLimit: 3,
    invoiceLimit: 1500,
  },
  {
    name: "Scale",
    monthly: 4990,
    storeLimit: 10,
    invoiceLimit: 5000,
  },
]

type PreviewTabKey = "orders" | "invoice" | "zip" | "voucher"

function formatPrice(price: number, locale: "en" | "th" | "zh") {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "th-TH").format(price)
}

export function MarketingPage() {
  const locale = useLocaleStore((state) => state.locale)
  const marketingLocale = locale === "th" || locale === "zh" ? locale : "en"
  const copy = marketingCopy[marketingLocale]

  const [annual, setAnnual] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isNavScrolled, setIsNavScrolled] = useState(false)

  // Interactive Product Showcase State
  const [activePreviewTab, setActivePreviewTab] = useState<PreviewTabKey>("orders")

  // Interactive Calculator State
  const [calcStores, setCalcStores] = useState(3)
  const [calcInvoices, setCalcInvoices] = useState(1200)

  // Feature Comparison Table Toggle
  const [showComparison, setShowComparison] = useState(false)

  // Enterprise Lead Capture Modal State
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [leadForm, setLeadForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    volume: "1,000 - 5,000",
    notes: "",
  })
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)
  const [isLeadSubmitted, setIsLeadSubmitted] = useState(false)

  const leadModalId = useId()

  useEffect(() => {
    const updateScrollState = () => {
      setShowScrollTop(window.scrollY > 420)
      setIsNavScrolled(window.scrollY > 8)
    }
    updateScrollState()
    window.addEventListener("scroll", updateScrollState, { passive: true })
    return () => window.removeEventListener("scroll", updateScrollState)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Calculator logic
  const calculatedResult = useMemo(() => {
    let recPlanName = "Starter"
    let baseMonthly = 990

    if (calcStores <= 1 && calcInvoices <= 300) {
      recPlanName = "Starter"
      baseMonthly = 990
    } else if (calcStores <= 3 && calcInvoices <= 1500) {
      recPlanName = "Growth"
      baseMonthly = 2490
    } else if (calcStores <= 10 && calcInvoices <= 5000) {
      recPlanName = "Scale"
      baseMonthly = 4990
    } else {
      recPlanName = "Enterprise"
      const extraStores = Math.max(0, calcStores - 10) * 390
      const extraInvoices = Math.max(0, calcInvoices - 5000) * 0.9
      baseMonthly = 4990 + extraStores + extraInvoices
    }

    const finalMonthly = annual ? Math.round(baseMonthly * 0.85) : Math.round(baseMonthly)
    // 3 minutes saved per manual invoice
    const hoursSaved = Math.max(1, Math.round((calcInvoices * 3) / 60))

    return {
      planName: recPlanName,
      price: finalMonthly,
      hoursSaved,
      planParam: recPlanName.toLowerCase().replace(/[^a-z]/g, ""),
    }
  }, [calcStores, calcInvoices, annual])

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingLead(true)
    setTimeout(() => {
      setIsSubmittingLead(false)
      setIsLeadSubmitted(true)
    }, 600)
  }

  const closeLeadModal = () => {
    setLeadModalOpen(false)
    setTimeout(() => {
      setIsLeadSubmitted(false)
      setLeadForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        volume: "1,000 - 5,000",
        notes: "",
      })
    }, 300)
  }

  return (
    <main className="marketing-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {/* Header */}
      <header className={isNavScrolled ? "site-header is-scrolled" : "site-header"}>
        <div className="marketing-container nav-row">
          <Link className="brand" to={ROUTES.home} aria-label="Laco Invoice home">
            <span className="brand-mark" aria-hidden="true">
              <ReceiptText size={20} />
            </span>
            <span>
              Laco<span>Invoice</span>
            </span>
          </Link>

          <nav className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="Main navigation">
            <a href="#features" onClick={() => setMenuOpen(false)}>
              {copy.nav.features}
            </a>
            <a href="#personas" onClick={() => setMenuOpen(false)}>
              {copy.nav.personas}
            </a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              {copy.nav.howItWorks}
            </a>
            <a href="#calculator" onClick={() => setMenuOpen(false)}>
              {copy.nav.calculator}
            </a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>
              {copy.nav.pricing}
            </a>
            <a href="#addons" onClick={() => setMenuOpen(false)}>
              {copy.nav.addons}
            </a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>
              {copy.nav.faq}
            </a>
          </nav>

          <div className="nav-actions">
            <NavbarLanguageToggle locales={["en", "th", "zh"]} className="marketing-language-select" />
            <Link className="login-link" to={ROUTES.auth.login}>
              {copy.nav.login}
            </Link>
            <button
              type="button"
              className="text-button demo-nav-button"
              onClick={() => setLeadModalOpen(true)}
            >
              {copy.nav.bookDemo}
            </button>
            <Link className="button button-small" to={`${ROUTES.auth.register}?plan=growth&billing=monthly`}>
              {copy.nav.startFree} <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <button
              className="menu-button"
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" id="main-content">
        <div className="marketing-container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={14} aria-hidden="true" /> {copy.hero.setup}
            </div>
            <h1>
              {copy.hero.title} <em>{copy.hero.emphasis}</em>
            </h1>
            <p className="hero-summary">{copy.hero.summary}</p>
            <div className="hero-actions">
              <Link className="button" to={`${ROUTES.auth.register}?plan=growth&billing=annual`}>
                {copy.nav.startFree} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className="text-button" href="#calculator">
                {copy.hero.seeCalculator} <ArrowRight size={16} aria-hidden="true" />
              </a>
              <a className="text-button secondary-link" href="#pricing">
                {copy.hero.seePricing}
              </a>
            </div>
            <p className="fine-print">
              <Check size={15} aria-hidden="true" /> {copy.hero.noCard} <span>•</span> {copy.hero.setup}
            </p>
          </div>

          {/* Interactive Product Showcase Mockup */}
          <div className="product-preview" aria-label="Interactive preview of the Laco Invoice workspace">
            <div className="preview-topbar">
              <span className="preview-logo">
                <ReceiptText size={15} /> LacoInvoice Workspace
              </span>
              <div className="preview-tabs" role="tablist" aria-label="Feature preview tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePreviewTab === "orders"}
                  className={activePreviewTab === "orders" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActivePreviewTab("orders")}
                >
                  {copy.preview.tabs.orders}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePreviewTab === "invoice"}
                  className={activePreviewTab === "invoice" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActivePreviewTab("invoice")}
                >
                  {copy.preview.tabs.invoice}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePreviewTab === "zip"}
                  className={activePreviewTab === "zip" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActivePreviewTab("zip")}
                >
                  {copy.preview.tabs.zip}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePreviewTab === "voucher"}
                  className={activePreviewTab === "voucher" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActivePreviewTab("voucher")}
                >
                  {copy.preview.tabs.voucher}
                </button>
              </div>
            </div>

            <div className="preview-content">
              <aside className="preview-sidebar" aria-hidden="true">
                <span className="active"></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </aside>

              <div className="preview-main">
                {/* Tab 1: Orders Inbox */}
                {activePreviewTab === "orders" && (
                  <div className="tab-pane">
                    <div className="preview-heading">
                      <div>
                        <span className="preview-kicker">{copy.preview.overview}</span>
                        <strong>{copy.preview.greeting}</strong>
                      </div>
                      <button type="button">{copy.preview.create}</button>
                    </div>
                    <div className="preview-stats">
                      <div>
                        <span>{copy.preview.orders}</span>
                        <strong>1,284</strong>
                        <small>+18.4%</small>
                      </div>
                      <div>
                        <span>{copy.preview.issued}</span>
                        <strong>1,109</strong>
                        <small>+12.6%</small>
                      </div>
                      <div>
                        <span>{copy.preview.total}</span>
                        <strong>฿842,590</strong>
                        <small>+9.2%</small>
                      </div>
                    </div>
                    <div className="preview-list">
                      <div className="list-header">
                        <strong>{copy.preview.recent}</strong>
                        <span>{copy.preview.viewAll}</span>
                      </div>
                      <div className="list-row">
                        <i></i>
                        <span>TK-93251084 (TikTok)</span>
                        <b>{copy.preview.ready}</b>
                        <strong>฿1,290</strong>
                      </div>
                      <div className="list-row">
                        <i></i>
                        <span>SP-21904822 (Shopee)</span>
                        <b>{copy.preview.ready}</b>
                        <strong>฿890</strong>
                      </div>
                      <div className="list-row">
                        <i></i>
                        <span>LZ-55128491 (Lazada)</span>
                        <b>{copy.preview.processing}</b>
                        <strong>฿2,450</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: 7% VAT Tax Invoice Document */}
                {activePreviewTab === "invoice" && (
                  <div className="tab-pane doc-view">
                    <div className="doc-header">
                      <div>
                        <span className="doc-badge">TAX INVOICE / RECEIPT</span>
                        <strong className="doc-num">INV-202609-001248</strong>
                      </div>
                      <span className="doc-vat-chip">7% VAT INCLUDED</span>
                    </div>
                    <div className="doc-body">
                      <div className="doc-parties">
                        <div>
                          <small>Seller / ผู้ประกอบการ:</small>
                          <b>Laconic Retail Co., Ltd. (HQ)</b>
                          <span>Tax ID: 0105560123456</span>
                        </div>
                        <div>
                          <small>Customer / ผู้ซื้อ:</small>
                          <b>Thant Zin (Individual)</b>
                          <span>Branch: 00000 (Head Office)</span>
                        </div>
                      </div>
                      <div className="doc-lines">
                        <div className="line-head">
                          <span>Description</span>
                          <span>Qty</span>
                          <span>Amount</span>
                        </div>
                        <div className="line-item">
                          <span>Wireless Headphone (SKU-HP10)</span>
                          <span>1</span>
                          <span>฿1,205.61</span>
                        </div>
                        <div className="line-item">
                          <span>Standard Shipping</span>
                          <span>1</span>
                          <span>฿0.00</span>
                        </div>
                      </div>
                      <div className="doc-totals">
                        <div>
                          <span>Subtotal:</span>
                          <b>฿1,205.61</b>
                        </div>
                        <div>
                          <span>VAT (7%):</span>
                          <b>฿84.39</b>
                        </div>
                        <div className="total-due">
                          <span>Total Paid:</span>
                          <b>฿1,290.00</b>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Bulk ZIP Export */}
                {activePreviewTab === "zip" && (
                  <div className="tab-pane zip-view">
                    <div className="preview-heading">
                      <div>
                        <span className="preview-kicker">MONTH-END CLOSE</span>
                        <strong>Bulk ZIP Export Batch #1094</strong>
                      </div>
                      <span className="batch-status">READY FOR DOWNLOAD</span>
                    </div>
                    <div className="zip-card">
                      <div className="zip-icon">
                        <Download size={24} />
                      </div>
                      <div className="zip-meta">
                        <strong>September_2026_Invoices_Full.zip</strong>
                        <span>1,284 tax invoices & receipts • 48.2 MB</span>
                        <div className="zip-progress-track">
                          <div className="zip-progress-bar" style={{ width: "100%" }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="zip-actions">
                      <span className="zip-hint">
                        <FileCheck2 size={15} /> All documents formatted to Thai RD 86/4 standard
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab 4: ERP Voucher Handoff */}
                {activePreviewTab === "voucher" && (
                  <div className="tab-pane voucher-view">
                    <div className="preview-heading">
                      <div>
                        <span className="preview-kicker">ERP ACCOUNTING INTEGRATION</span>
                        <strong>Journal Voucher JV-202609-082</strong>
                      </div>
                      <span className="batch-status balanced">BALANCED</span>
                    </div>
                    <div className="voucher-table">
                      <div className="voucher-head">
                        <span>Account Code</span>
                        <span>Account Name</span>
                        <span>Debit</span>
                        <span>Credit</span>
                      </div>
                      <div className="voucher-row">
                        <span>1130-00</span>
                        <span>TikTok Clearing A/C</span>
                        <strong>฿1,290.00</strong>
                        <span>-</span>
                      </div>
                      <div className="voucher-row">
                        <span>4110-00</span>
                        <span>Sales Revenue</span>
                        <span>-</span>
                        <strong>฿1,205.61</strong>
                      </div>
                      <div className="voucher-row">
                        <span>2130-00</span>
                        <span>Output VAT (7%)</span>
                        <span>-</span>
                        <strong>฿84.39</strong>
                      </div>
                    </div>
                    <div className="voucher-footer">
                      <span>Compatible with SAP, Express, Odoo & Dynamics</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="preview-footer-strip">
              <span>{copy.preview.tabDescriptions[activePreviewTab]}</span>
            </div>
          </div>
        </div>

        {/* Marketplace Strip */}
        <div className="marketplace-strip">
          <div className="marketing-container">
            <span>{copy.marketplace}</span>
            <strong className="platform-tag tiktok">TikTok Shop</strong>
            <strong className="platform-tag shopee">Shopee</strong>
            <strong className="platform-tag lazada">Lazada</strong>
            <strong className="platform-tag amazon">Amazon</strong>
          </div>
        </div>
      </section>

      {/* Core Features / Problem & Solution */}
      <section className="section problem-section" id="features" aria-labelledby="features-title">
        <div className="marketing-container operations-intro">
          <h2 id="features-title">{copy.features.title}</h2>
          <p>{copy.features.summary}</p>
        </div>
        <div className="marketing-container benefits-grid">
          <article>
            <span className="icon-wrap coral">
              <PackageCheck aria-hidden="true" />
            </span>
            <p className="feature-number">01</p>
            <h3>{copy.features.cards[0][0]}</h3>
            <p>{copy.features.cards[0][1]}</p>
          </article>
          <article>
            <span className="icon-wrap gold">
              <FileText aria-hidden="true" />
            </span>
            <p className="feature-number">02</p>
            <h3>{copy.features.cards[1][0]}</h3>
            <p>{copy.features.cards[1][1]}</p>
          </article>
          <article>
            <span className="icon-wrap violet">
              <BarChart3 aria-hidden="true" />
            </span>
            <p className="feature-number">03</p>
            <h3>{copy.features.cards[2][0]}</h3>
            <p>{copy.features.cards[2][1]}</p>
          </article>
        </div>
      </section>

      {/* Target Personas Section */}
      <section className="section personas-section" id="personas" aria-labelledby="personas-title">
        <div className="marketing-container section-intro centered">
          <p className="eyebrow">{copy.personas.eyebrow}</p>
          <h2 id="personas-title">{copy.personas.title}</h2>
          <p>{copy.personas.summary}</p>
        </div>

        <div className="marketing-container personas-grid">
          {copy.personas.items.map((item, index) => {
            const icons = [<PackageCheck key="0" size={26} />, <ReceiptText key="1" size={26} />, <Building2 key="2" size={26} />]
            return (
              <article className="persona-card" key={item.role}>
                <div className="persona-header">
                  <span className="persona-icon-box">{icons[index]}</span>
                  <div>
                    <h3>{item.role}</h3>
                    <p className="persona-tagline">{item.tagline}</p>
                  </div>
                </div>
                <ul className="persona-points">
                  {item.points.map((point) => (
                    <li key={point}>
                      <Check size={16} aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      {/* ERP Voucher Spotlight */}
      <section className="section erp-spotlight-section" id="erp-spotlight" aria-labelledby="erp-title">
        <div className="marketing-container section-intro">
          <p className="eyebrow">{copy.erpSpotlight.eyebrow}</p>
          <h2 id="erp-title">{copy.erpSpotlight.title}</h2>
          <p>{copy.erpSpotlight.summary}</p>
        </div>
        <div className="marketing-container erp-grid">
          {copy.erpSpotlight.cards.map((card, idx) => {
            const icons = [<Layers key="0" size={24} />, <FileSpreadsheet key="1" size={24} />, <ShieldCheck key="2" size={24} />]
            return (
              <div className="erp-card" key={card.title}>
                <span className="erp-icon">{icons[idx]}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5-Step Workflow */}
      <section className="section how-section" id="how-it-works" aria-labelledby="how-it-works-title">
        <div className="marketing-container">
          <div className="section-intro">
            <p className="eyebrow">{copy.flow.eyebrow}</p>
            <h2 id="how-it-works-title">{copy.flow.title}</h2>
            <p>{copy.flow.summary}</p>
          </div>
          <ol className="steps five-steps">
            {copy.flow.steps.map(([title, description], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Interactive ROI & Pricing Calculator */}
      <section className="section calculator-section" id="calculator" aria-labelledby="calc-title">
        <div className="marketing-container">
          <div className="section-intro centered">
            <p className="eyebrow">{copy.calculator.eyebrow}</p>
            <h2 id="calc-title">{copy.calculator.title}</h2>
            <p>{copy.calculator.summary}</p>
          </div>

          <div className="calculator-widget">
            <div className="calculator-controls">
              {/* Slider 1: Stores */}
              <div className="slider-group">
                <div className="slider-header">
                  <label htmlFor="stores-slider">{copy.calculator.storesLabel}</label>
                  <span className="slider-val">
                    <strong>{calcStores}</strong> {calcStores === 1 ? "store" : "stores"}
                  </span>
                </div>
                <input
                  id="stores-slider"
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={calcStores}
                  onChange={(e) => setCalcStores(Number(e.target.value))}
                />
                <div className="slider-ticks">
                  <span>1 store</span>
                  <span>5 stores</span>
                  <span>10 stores</span>
                  <span>15 stores</span>
                </div>
              </div>

              {/* Slider 2: Invoices */}
              <div className="slider-group">
                <div className="slider-header">
                  <label htmlFor="invoices-slider">{copy.calculator.invoicesLabel}</label>
                  <span className="slider-val">
                    <strong>{formatPrice(calcInvoices, marketingLocale)}</strong> docs
                  </span>
                </div>
                <input
                  id="invoices-slider"
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={calcInvoices}
                  onChange={(e) => setCalcInvoices(Number(e.target.value))}
                />
                <div className="slider-ticks">
                  <span>100 docs</span>
                  <span>2,500 docs</span>
                  <span>5,000 docs</span>
                  <span>10,000 docs</span>
                </div>
              </div>
            </div>

            {/* Calculator Output Card */}
            <div className="calculator-output">
              <div className="output-row">
                <span className="output-label">{copy.calculator.recommendedPlan}</span>
                <strong className="output-plan">{calculatedResult.planName}</strong>
              </div>

              <div className="output-price-box">
                <span className="output-label">{copy.calculator.estimatedCost}</span>
                <p className="output-price">
                  <span>฿</span>
                  {formatPrice(calculatedResult.price, marketingLocale)}
                  <small>{copy.pricing.perMonth}</small>
                </p>
                {annual && <span className="calc-annual-badge">{copy.calculator.annualSavingNote}</span>}
              </div>

              <div className="output-savings-box">
                <Clock size={20} className="clock-icon" />
                <div>
                  <span className="output-label">{copy.calculator.timeSavedLabel}</span>
                  <p className="output-hours">
                    <strong>~{calculatedResult.hoursSaved}</strong> {copy.calculator.timeSavedUnit}
                  </p>
                  <small>{copy.calculator.timeSavedExplanation}</small>
                </div>
              </div>

              <Link
                className="button calc-cta-button"
                to={`${ROUTES.auth.register}?plan=${calculatedResult.planParam}&billing=${annual ? "annual" : "monthly"}`}
              >
                {copy.calculator.cta} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section pricing-section" id="pricing" aria-labelledby="pricing-title">
        <div className="marketing-container">
          <div className="pricing-heading">
            <div>
              <p className="eyebrow">{copy.pricing.eyebrow}</p>
              <h2 id="pricing-title">{copy.pricing.title}</h2>
              <p>{copy.pricing.summary}</p>
            </div>
            <div className="billing-toggle" role="group" aria-label="Billing period">
              <button
                type="button"
                className={!annual ? "selected" : ""}
                onClick={() => setAnnual(false)}
                aria-pressed={!annual}
              >
                {copy.pricing.monthly}
              </button>
              <button
                type="button"
                className={annual ? "selected" : ""}
                onClick={() => setAnnual(true)}
                aria-pressed={annual}
              >
                {copy.pricing.annual} <span>{copy.pricing.save}</span>
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            {plans.map((plan, index) => {
              const planCopy = copy.pricing.plans[index]
              const price = annual ? Math.round(plan.monthly * 0.85) : plan.monthly
              const annualPrice = Math.round(plan.monthly * 12 * 0.85)
              const registerUrl = `${ROUTES.auth.register}?plan=${plan.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}`

              return (
                <article className={plan.featured ? "pricing-card featured" : "pricing-card"} key={plan.name}>
                  {plan.featured && <p className="popular">{copy.pricing.popular}</p>}
                  <h3>{plan.name}</h3>
                  <p className="plan-description">{planCopy[0]}</p>
                  <p className="price">
                    <span>฿</span>
                    {formatPrice(price, marketingLocale)}
                    <small>{copy.pricing.perMonth}</small>
                  </p>
                  {annual && (
                    <p className="annual-note">
                      {copy.pricing.billed} ฿{formatPrice(annualPrice, marketingLocale)} {copy.pricing.annual}
                    </p>
                  )}
                  <Link
                    className={plan.featured ? "button plan-button" : "button button-outline plan-button"}
                    to={registerUrl}
                  >
                    {copy.nav.startFree} <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <ul>
                    <li>
                      <strong>{planCopy[1]}</strong>
                    </li>
                    <li>
                      <strong>{planCopy[2]}</strong>
                    </li>
                    {planCopy[3].map((feature) => (
                      <li key={feature}>
                        <Check size={16} aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>

          {/* Enterprise Banner */}
          <div className="enterprise-row">
            <div>
              <strong>{copy.enterprise.title}</strong>
              <span>{copy.enterprise.summary}</span>
            </div>
            <button
              type="button"
              className="button button-small enterprise-btn"
              onClick={() => setLeadModalOpen(true)}
            >
              {copy.enterprise.action} <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Optional Add-ons Section */}
      <section className="section addons-section" id="addons" aria-labelledby="addons-title">
        <div className="marketing-container">
          <div className="section-intro">
            <p className="eyebrow">{copy.addons.eyebrow}</p>
            <h2 id="addons-title">{copy.addons.title}</h2>
            <p>{copy.addons.summary}</p>
          </div>

          <div className="addons-grid">
            {copy.addons.items.map((addon) => (
              <div className="addon-card" key={addon.name}>
                <div className="addon-top">
                  <h3>{addon.name}</h3>
                  <p className="addon-price">
                    <strong>{addon.price}</strong>
                    <small>{addon.unit}</small>
                  </p>
                </div>
                <p className="addon-desc">{addon.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Matrix Accordion */}
      <section className="section comparison-section" aria-labelledby="comparison-title">
        <div className="marketing-container">
          <div className="comparison-toggle-bar">
            <div>
              <p className="eyebrow">{copy.comparison.eyebrow}</p>
              <h2 id="comparison-title">{copy.comparison.title}</h2>
              <p>{copy.comparison.summary}</p>
            </div>
            <button
              type="button"
              className="button button-outline toggle-comp-btn"
              onClick={() => setShowComparison(!showComparison)}
              aria-expanded={showComparison}
            >
              {showComparison ? copy.comparison.toggleHide : copy.comparison.toggleShow}
              <ChevronDown className={showComparison ? "rotate-180" : ""} size={16} />
            </button>
          </div>

          {showComparison && (
            <div className="comparison-table-wrapper" role="region" aria-label="Plan comparison table">
              <table className="comparison-table">
                <thead>
                  <tr>
                    {copy.comparison.headers.map((h, i) => (
                      <th key={h} className={i === 0 ? "text-left" : "text-center"}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {copy.comparison.categories.map((category) => (
                    <tr key={category.name} className="category-header-row">
                      <td colSpan={5}>
                        <strong>{category.name}</strong>
                      </td>
                    </tr>
                  ))}
                  {copy.comparison.categories.flatMap((cat) =>
                    cat.rows.map(([rowLabel, s, g, sc, ent]) => (
                      <tr key={rowLabel}>
                        <td className="feature-name-cell">{rowLabel}</td>
                        <td className="text-center cell-val">{renderCellVal(s)}</td>
                        <td className="text-center cell-val featured-col">{renderCellVal(g)}</td>
                        <td className="text-center cell-val">{renderCellVal(sc)}</td>
                        <td className="text-center cell-val">{renderCellVal(ent)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section faq-section" id="faq" aria-labelledby="faq-title">
        <div className="marketing-container faq-layout">
          <div>
            <p className="eyebrow">{copy.faq.eyebrow}</p>
            <h2 id="faq-title">{copy.faq.title}</h2>
            <p>{copy.faq.summary}</p>
            <button
              type="button"
              className="text-button"
              onClick={() => setLeadModalOpen(true)}
            >
              {copy.enterprise.action} <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="faq-list">
            {copy.faq.items.map(([question, answer], index) => {
              const isOpen = activeFaq === index
              const answerId = `faq-answer-${index}`
              return (
                <article className={isOpen ? "faq-item is-open" : "faq-item"} key={question}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                    >
                      {question}
                      <ChevronDown aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={answerId} role="region" aria-label={question} hidden={!isOpen}>
                    <p>{answer}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="cta-section">
        <div className="marketing-container cta-inner">
          <div>
            <p className="eyebrow">{copy.cta.eyebrow}</p>
            <h2>{copy.cta.title}</h2>
            <p>{copy.cta.summary}</p>
          </div>
          <div className="cta-buttons">
            <Link className="button button-light" to={`${ROUTES.auth.register}?plan=growth&billing=annual`}>
              {copy.cta.primaryAction} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="button button-outline-light"
              onClick={() => setLeadModalOpen(true)}
            >
              {copy.cta.secondaryAction}
            </button>
          </div>
        </div>
      </section>

      {/* Expanded Multi-Column Footer */}
      <footer className="site-footer">
        <div className="marketing-container footer-grid">
          <div className="footer-brand-col">
            <Link className="brand footer-brand" to={ROUTES.home}>
              <span className="brand-mark" aria-hidden="true">
                <ReceiptText size={18} />
              </span>
              <span>
                Laco<span>Invoice</span>
              </span>
            </Link>
            <p className="footer-tagline">{copy.cta.footer}</p>
            <p className="footer-legal">{copy.footer.legalText}</p>
            <p className="footer-copy">
              © {new Date().getFullYear()} Laconic. {copy.cta.rights}
            </p>
          </div>

          <div className="footer-nav-col">
            <h4>{copy.footer.columns.product.title}</h4>
            <ul>
              {copy.footer.columns.product.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4>{copy.footer.columns.solutions.title}</h4>
            <ul>
              {copy.footer.columns.solutions.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4>{copy.footer.columns.resources.title}</h4>
            <ul>
              {copy.footer.columns.resources.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4>{copy.footer.columns.company.title}</h4>
            <ul>
              {copy.footer.columns.company.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>

      {/* Enterprise Lead Capture Modal */}
      {leadModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={leadModalId}>
          <div className="modal-card">
            <button
              type="button"
              className="modal-close-btn"
              onClick={closeLeadModal}
              aria-label={copy.leadModal.close}
            >
              <X size={20} />
            </button>

            {!isLeadSubmitted ? (
              <form onSubmit={handleLeadSubmit} className="lead-form">
                <h3 id={leadModalId}>{copy.leadModal.title}</h3>
                <p className="modal-summary">{copy.leadModal.summary}</p>

                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="lead-name">{copy.leadModal.nameLabel} *</label>
                    <input
                      id="lead-name"
                      type="text"
                      required
                      placeholder={copy.leadModal.namePlaceholder}
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="lead-company">{copy.leadModal.companyLabel} *</label>
                    <input
                      id="lead-company"
                      type="text"
                      required
                      placeholder={copy.leadModal.companyPlaceholder}
                      value={leadForm.company}
                      onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="lead-email">{copy.leadModal.emailLabel} *</label>
                    <input
                      id="lead-email"
                      type="email"
                      required
                      placeholder={copy.leadModal.emailPlaceholder}
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="lead-phone">{copy.leadModal.phoneLabel} *</label>
                    <input
                      id="lead-phone"
                      type="text"
                      required
                      placeholder={copy.leadModal.phonePlaceholder}
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="lead-volume">{copy.leadModal.volumeLabel}</label>
                  <select
                    id="lead-volume"
                    value={leadForm.volume}
                    onChange={(e) => setLeadForm({ ...leadForm, volume: e.target.value })}
                  >
                    {copy.leadModal.volumeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="lead-notes">{copy.leadModal.notesLabel}</label>
                  <textarea
                    id="lead-notes"
                    rows={3}
                    placeholder={copy.leadModal.notesPlaceholder}
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="button button-outline" onClick={closeLeadModal}>
                    {copy.leadModal.close}
                  </button>
                  <button type="submit" className="button" disabled={isSubmittingLead}>
                    {isSubmittingLead ? (
                      copy.leadModal.submitting
                    ) : (
                      <>
                        {copy.leadModal.submit} <Send size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="lead-success-state">
                <span className="success-icon">
                  <Check size={32} />
                </span>
                <h3>{copy.leadModal.successTitle}</h3>
                <p>{copy.leadModal.successMessage}</p>
                <button type="button" className="button" onClick={closeLeadModal}>
                  {copy.leadModal.close}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scroll to top button */}
      <button
        className={showScrollTop ? "scroll-top is-visible" : "scroll-top"}
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        tabIndex={showScrollTop ? 0 : -1}
      >
        <ArrowUp size={20} aria-hidden="true" />
      </button>
    </main>
  )
}

function renderCellVal(val: string | boolean) {
  if (val === "check" || val === true) {
    return <Check className="cell-check" size={18} aria-label="Supported" />
  }
  if (val === "dash" || val === false) {
    return <Minus className="cell-dash" size={18} aria-label="Not supported" />
  }
  return <span>{val}</span>
}
