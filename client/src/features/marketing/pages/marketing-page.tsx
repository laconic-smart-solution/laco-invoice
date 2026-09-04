import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  FileText,
  Menu,
  PackageCheck,
  ReceiptText,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import "@/features/marketing/pages/marketing-page.css"

const plans = [
  {
    name: "Starter",
    description: "A reliable daily workflow for one growing store.",
    monthly: 990,
    stores: "1 marketplace store",
    invoices: "300 invoices / month",
    features: ["Marketplace order sync", "Tax invoice & receipt PDFs", "Product and SKU management", "Email support"],
  },
  {
    name: "Growth",
    description: "More channels, less admin, and a faster finance handoff.",
    monthly: 2490,
    stores: "3 marketplace stores",
    invoices: "1,500 invoices / month",
    featured: true,
    features: ["Everything in Starter", "Automatic order sync", "Bulk PDF ZIP export", "ERP voucher workflow support", "Priority email support"],
  },
  {
    name: "Scale",
    description: "Capacity and controls for established operations.",
    monthly: 4990,
    stores: "10 marketplace stores",
    invoices: "5,000 invoices / month",
    features: ["Everything in Growth", "Multi-user team access", "Advanced export workflows", "Purchase order support", "Priority support"],
  },
]

const faqs = [
  ["Can I change plans as my business grows?", "Yes. Move to a higher plan whenever you need more marketplace stores or invoice capacity."],
  ["What happens if I use more invoices than my plan includes?", "Continue issuing documents at ฿0.90 per additional invoice. Usage is billed at the end of the billing month."],
  ["Does Laco Invoice support VAT documents?", "Laco Invoice generates tax invoices and receipts with 7% VAT applied to each document."],
  ["Which marketplaces can I connect?", "The product is designed for marketplace operations including TikTok Shop, Shopee, Lazada, and Amazon. Confirm the configuration available for your rollout with our team."],
]

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-TH").format(price)
}

export function MarketingPage() {
  const [annual, setAnnual] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isNavScrolled, setIsNavScrolled] = useState(false)

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

  return (
    <main className="marketing-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className={isNavScrolled ? "site-header is-scrolled" : "site-header"}>
        <div className="marketing-container nav-row">
          <Link className="brand" to={ROUTES.home} aria-label="Laco Invoice home">
            <span className="brand-mark" aria-hidden="true"><ReceiptText size={20} /></span>
            <span>Laco<span>Invoice</span></span>
          </Link>
          <nav className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="Main navigation">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          </nav>
          <div className="nav-actions">
            <Link className="login-link" to={ROUTES.auth.login}>Log in</Link>
            <Link className="button button-small" to={ROUTES.auth.register}>Start free <ArrowRight size={15} aria-hidden="true" /></Link>
            <button className="menu-button" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="main-content">
        <div className="marketing-container hero-grid">
          <div className="hero-copy">
            <h1>Every marketplace order, <em>invoice ready.</em></h1>
            <p className="hero-summary">Laco Invoice connects your sales channels, brings orders into one clear workspace, and makes it easy to issue professional tax invoices and receipts.</p>
            <div className="hero-actions">
              <Link className="button" to={ROUTES.auth.register}>Start free <ArrowRight size={18} aria-hidden="true" /></Link>
              <a className="text-button" href="#pricing">See pricing <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <p className="fine-print"><Check size={15} aria-hidden="true" /> No credit card required <span>•</span> Set up in minutes</p>
          </div>
          <div className="product-preview" aria-label="Preview of the Laco Invoice workspace">
            <div className="preview-topbar"><span className="preview-logo"><ReceiptText size={15} /> LacoInvoice</span><span className="preview-avatar">JP</span></div>
            <div className="preview-content">
              <aside className="preview-sidebar" aria-hidden="true"><span className="active"></span><span></span><span></span><span></span><span></span></aside>
              <div className="preview-main">
                <div className="preview-heading"><div><span className="preview-kicker">Overview</span><strong>Good morning, James</strong></div><button type="button">+ Create invoice</button></div>
                <div className="preview-stats"><div><span>Orders this month</span><strong>1,284</strong><small>+18.4%</small></div><div><span>Invoices issued</span><strong>1,109</strong><small>+12.6%</small></div><div><span>Document total</span><strong>฿842,590</strong><small>+9.2%</small></div></div>
                <div className="preview-list"><div className="list-header"><strong>Recent orders</strong><span>View all</span></div><div className="list-row"><i></i><span>TK-93251084</span><b>Tax invoice ready</b><strong>฿1,290</strong></div><div className="list-row"><i></i><span>SP-21904822</span><b>Tax invoice ready</b><strong>฿890</strong></div><div className="list-row"><i></i><span>LZ-55128491</span><b>Processing</b><strong>฿2,450</strong></div></div>
              </div>
            </div>
          </div>
        </div>
        <div className="marketplace-strip"><div className="marketing-container"><span>Built to simplify operations across</span><strong>TikTok Shop</strong><strong>Shopee</strong><strong>Lazada</strong><strong>Amazon</strong></div></div>
      </section>

      <section className="section problem-section" aria-labelledby="features">
        <div className="marketing-container operations-intro"><h2 id="features">Everything you need to turn orders into ready-to-send documents.</h2><p>Bring marketplace sales, tax documents, and finance handoffs into one reliable daily workflow—without the portal switching and spreadsheet chasing.</p></div>
        <div className="marketing-container benefits-grid">
          <article><span className="icon-wrap coral"><PackageCheck aria-hidden="true" /></span><p className="feature-number">01</p><h3>See every order in one place</h3><p>Keep marketplace orders searchable, filterable, and ready for action in one organised workspace.</p></article>
          <article><span className="icon-wrap gold"><FileText aria-hidden="true" /></span><p className="feature-number">02</p><h3>Create documents in moments</h3><p>Generate tax invoices and receipts with consistent numbering and 7% VAT already applied.</p></article>
          <article><span className="icon-wrap violet"><BarChart3 aria-hidden="true" /></span><p className="feature-number">03</p><h3>Keep finance moving</h3><p>Export PDFs individually or in bulk, then prepare invoice information for ERP voucher workflows.</p></article>
        </div>
      </section>

      <section className="section how-section" id="how-it-works" aria-labelledby="how-title"><div className="marketing-container"><div className="section-intro"><p className="eyebrow">A simple flow</p><h2 id="how-title">Less chasing. More done.</h2><p>From a completed marketplace order to a document your team can share, Laco Invoice keeps the workflow moving.</p></div><ol className="steps"><li><span>01</span><h3>Connect your store</h3><p>Link your marketplace storefront and bring your orders into Laco Invoice.</p></li><li><span>02</span><h3>Keep orders current</h3><p>Sync on demand or let automatic syncing keep your view up to date.</p></li><li><span>03</span><h3>Issue and export</h3><p>Generate your document, then print, download, or send a bulk ZIP to finance.</p></li></ol></div></section>

      <section className="section pricing-section" id="pricing" aria-labelledby="pricing-title"><div className="marketing-container"><div className="pricing-heading"><div><p className="eyebrow">Straightforward pricing</p><h2 id="pricing-title">A plan that grows with your business.</h2><p>Start simply, add stores and capacity when you need them, and keep every team in the same workflow.</p></div><div className="billing-toggle" role="group" aria-label="Billing period"><button type="button" className={!annual ? "selected" : ""} onClick={() => setAnnual(false)} aria-pressed={!annual}>Monthly</button><button type="button" className={annual ? "selected" : ""} onClick={() => setAnnual(true)} aria-pressed={annual}>Annual <span>Save 15%</span></button></div></div>
        <div className="pricing-grid">{plans.map((plan) => { const price = annual ? Math.round(plan.monthly * 0.85) : plan.monthly; const annualPrice = Math.round(plan.monthly * 12 * 0.85); return <article className={plan.featured ? "pricing-card featured" : "pricing-card"} key={plan.name}>{plan.featured && <p className="popular">Most popular</p>}<h3>{plan.name}</h3><p className="plan-description">{plan.description}</p><p className="price"><span>฿</span>{formatPrice(price)}<small>/ month</small></p>{annual && <p className="annual-note">Billed ฿{formatPrice(annualPrice)} annually</p>}<Link className={plan.featured ? "button plan-button" : "button button-outline plan-button"} to={ROUTES.auth.register}>Start free <ArrowRight size={16} aria-hidden="true" /></Link><ul><li><strong>{plan.stores}</strong></li><li><strong>{plan.invoices}</strong></li>{plan.features.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul></article>})}</div>
        <div className="enterprise-row"><div><strong>Need a tailored rollout?</strong><span>Custom volumes, onboarding, and ERP workflow configuration for complex operations.</span></div><a href="mailto:sales@laconic.co.th?subject=Laco%20Invoice%20Enterprise%20enquiry">Talk to sales <ArrowRight size={16} aria-hidden="true" /></a></div>
      </div></section>

      <section className="section faq-section" id="faq" aria-labelledby="faq-title"><div className="marketing-container faq-layout"><div><p className="eyebrow">Questions, answered</p><h2 id="faq-title">Everything you need to know to get started.</h2><p>Still deciding? Our team can help you find the right plan for the way your business works.</p><a className="text-button" href="mailto:sales@laconic.co.th">Talk to sales <ArrowRight size={16} aria-hidden="true" /></a></div><div className="faq-list">{faqs.map(([question, answer], index) => { const isOpen = activeFaq === index; const answerId = `faq-answer-${index}`; return <article className={isOpen ? "faq-item is-open" : "faq-item"} key={question}><h3><button type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setActiveFaq(isOpen ? -1 : index)}>{question}<ChevronDown aria-hidden="true" /></button></h3><div id={answerId} role="region" aria-label={question} hidden={!isOpen}><p>{answer}</p></div></article> })}</div></div></section>

      <section className="cta-section"><div className="marketing-container cta-inner"><div><p className="eyebrow">Ready when you are</p><h2>Make invoices the easiest part of your operation.</h2><p>Bring your marketplace orders, tax documents, and finance workflow into one clear system.</p></div><Link className="button button-light" to={ROUTES.auth.register}>Start free <ArrowRight size={18} aria-hidden="true" /></Link></div></section>
      <footer className="site-footer"><div className="marketing-container footer-row"><Link className="brand" to={ROUTES.home}><span className="brand-mark" aria-hidden="true"><ReceiptText size={18} /></span><span>Laco<span>Invoice</span></span></Link><p>Marketplace invoicing, made clear.</p><p>© {new Date().getFullYear()} Laconic. All rights reserved.</p></div></footer>
      <button className={showScrollTop ? "scroll-top is-visible" : "scroll-top"} type="button" onClick={scrollToTop} aria-label="Back to top" tabIndex={showScrollTop ? 0 : -1}>
        <ArrowUp size={20} aria-hidden="true" />
      </button>
    </main>
  )
}
