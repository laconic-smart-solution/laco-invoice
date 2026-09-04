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
import { NavbarLanguageToggle } from "@/components/core/navbar/navbar-language-toggle"
import { marketingCopy } from "@/features/marketing/pages/marketing-copy"
import "@/features/marketing/pages/marketing-page.css"
import { useLocaleStore } from "@/shared/stores/locale-store"

const plans = [
  {
    name: "Starter",
    monthly: 990,
  },
  {
    name: "Growth",
    monthly: 2490,
    featured: true,
  },
  {
    name: "Scale",
    monthly: 4990,
  },
]

function formatPrice(price: number, locale: "en" | "th" | "zh") {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "th-TH").format(price)
}

export function MarketingPage() {
  const locale = useLocaleStore((state) => state.locale)
  const marketingLocale = locale === "th" || locale === "zh" ? locale : "en"
  const copy = marketingCopy[marketingLocale]
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
            <a href="#features" onClick={() => setMenuOpen(false)}>{copy.nav.features}</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>{copy.nav.howItWorks}</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>{copy.nav.pricing}</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>{copy.nav.faq}</a>
          </nav>
          <div className="nav-actions">
            <NavbarLanguageToggle locales={["en", "th", "zh"]} className="marketing-language-select" />
            <Link className="login-link" to={ROUTES.auth.login}>{copy.nav.login}</Link>
            <Link className="button button-small" to={ROUTES.auth.register}>{copy.nav.startFree} <ArrowRight size={15} aria-hidden="true" /></Link>
            <button className="menu-button" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="main-content">
        <div className="marketing-container hero-grid">
          <div className="hero-copy">
            <h1>{copy.hero.title} <em>{copy.hero.emphasis}</em></h1>
            <p className="hero-summary">{copy.hero.summary}</p>
            <div className="hero-actions">
              <Link className="button" to={ROUTES.auth.register}>{copy.nav.startFree} <ArrowRight size={18} aria-hidden="true" /></Link>
              <a className="text-button" href="#pricing">{copy.hero.seePricing} <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <p className="fine-print"><Check size={15} aria-hidden="true" /> {copy.hero.noCard} <span>•</span> {copy.hero.setup}</p>
          </div>
          <div className="product-preview" aria-label="Preview of the Laco Invoice workspace">
            <div className="preview-topbar"><span className="preview-logo"><ReceiptText size={15} /> LacoInvoice</span><span className="preview-avatar">JP</span></div>
            <div className="preview-content">
              <aside className="preview-sidebar" aria-hidden="true"><span className="active"></span><span></span><span></span><span></span><span></span></aside>
              <div className="preview-main">
                <div className="preview-heading"><div><span className="preview-kicker">{copy.preview.overview}</span><strong>{copy.preview.greeting}</strong></div><button type="button">{copy.preview.create}</button></div>
                <div className="preview-stats"><div><span>{copy.preview.orders}</span><strong>1,284</strong><small>+18.4%</small></div><div><span>{copy.preview.issued}</span><strong>1,109</strong><small>+12.6%</small></div><div><span>{copy.preview.total}</span><strong>฿842,590</strong><small>+9.2%</small></div></div>
                <div className="preview-list"><div className="list-header"><strong>{copy.preview.recent}</strong><span>{copy.preview.viewAll}</span></div><div className="list-row"><i></i><span>TK-93251084</span><b>{copy.preview.ready}</b><strong>฿1,290</strong></div><div className="list-row"><i></i><span>SP-21904822</span><b>{copy.preview.ready}</b><strong>฿890</strong></div><div className="list-row"><i></i><span>LZ-55128491</span><b>{copy.preview.processing}</b><strong>฿2,450</strong></div></div>
              </div>
            </div>
          </div>
        </div>
        <div className="marketplace-strip"><div className="marketing-container"><span>{copy.marketplace}</span><strong>TikTok Shop</strong><strong>Shopee</strong><strong>Lazada</strong><strong>Amazon</strong></div></div>
      </section>

      <section className="section problem-section" aria-labelledby="features">
        <div className="marketing-container operations-intro"><h2 id="features">{copy.features.title}</h2><p>{copy.features.summary}</p></div>
        <div className="marketing-container benefits-grid">
          <article><span className="icon-wrap coral"><PackageCheck aria-hidden="true" /></span><p className="feature-number">01</p><h3>{copy.features.cards[0][0]}</h3><p>{copy.features.cards[0][1]}</p></article>
          <article><span className="icon-wrap gold"><FileText aria-hidden="true" /></span><p className="feature-number">02</p><h3>{copy.features.cards[1][0]}</h3><p>{copy.features.cards[1][1]}</p></article>
          <article><span className="icon-wrap violet"><BarChart3 aria-hidden="true" /></span><p className="feature-number">03</p><h3>{copy.features.cards[2][0]}</h3><p>{copy.features.cards[2][1]}</p></article>
        </div>
      </section>

      <section className="section how-section" aria-labelledby="how-it-works"><div className="marketing-container"><div className="section-intro"><p className="eyebrow">{copy.flow.eyebrow}</p><h2 id="how-it-works">{copy.flow.title}</h2><p>{copy.flow.summary}</p></div><ol className="steps">{copy.flow.steps.map(([title, description], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></div></section>

      <section className="section pricing-section" aria-labelledby="pricing"><div className="marketing-container"><div className="pricing-heading"><div><p className="eyebrow">{copy.pricing.eyebrow}</p><h2 id="pricing">{copy.pricing.title}</h2><p>{copy.pricing.summary}</p></div><div className="billing-toggle" role="group" aria-label="Billing period"><button type="button" className={!annual ? "selected" : ""} onClick={() => setAnnual(false)} aria-pressed={!annual}>{copy.pricing.monthly}</button><button type="button" className={annual ? "selected" : ""} onClick={() => setAnnual(true)} aria-pressed={annual}>{copy.pricing.annual} <span>{copy.pricing.save}</span></button></div></div>
        <div className="pricing-grid">{plans.map((plan, index) => { const planCopy = copy.pricing.plans[index]; const price = annual ? Math.round(plan.monthly * 0.85) : plan.monthly; const annualPrice = Math.round(plan.monthly * 12 * 0.85); return <article className={plan.featured ? "pricing-card featured" : "pricing-card"} key={plan.name}>{plan.featured && <p className="popular">{copy.pricing.popular}</p>}<h3>{plan.name}</h3><p className="plan-description">{planCopy[0]}</p><p className="price"><span>฿</span>{formatPrice(price, marketingLocale)}<small>{copy.pricing.perMonth}</small></p>{annual && <p className="annual-note">{copy.pricing.billed} ฿{formatPrice(annualPrice, marketingLocale)} {copy.pricing.annual}</p>}<Link className={plan.featured ? "button plan-button" : "button button-outline plan-button"} to={ROUTES.auth.register}>{copy.nav.startFree} <ArrowRight size={16} aria-hidden="true" /></Link><ul><li><strong>{planCopy[1]}</strong></li><li><strong>{planCopy[2]}</strong></li>{planCopy[3].map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul></article>})}</div>
        <div className="enterprise-row"><div><strong>{copy.enterprise.title}</strong><span>{copy.enterprise.summary}</span></div><a href="mailto:sales@laconic.co.th?subject=Laco%20Invoice%20Enterprise%20enquiry">{copy.enterprise.action} <ArrowRight size={16} aria-hidden="true" /></a></div>
      </div></section>

      <section className="section faq-section" id="faq" aria-labelledby="faq-title"><div className="marketing-container faq-layout"><div><p className="eyebrow">{copy.faq.eyebrow}</p><h2 id="faq-title">{copy.faq.title}</h2><p>{copy.faq.summary}</p><a className="text-button" href="mailto:sales@laconic.co.th">{copy.enterprise.action} <ArrowRight size={16} aria-hidden="true" /></a></div><div className="faq-list">{copy.faq.items.map(([question, answer], index) => { const isOpen = activeFaq === index; const answerId = `faq-answer-${index}`; return <article className={isOpen ? "faq-item is-open" : "faq-item"} key={question}><h3><button type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setActiveFaq(isOpen ? -1 : index)}>{question}<ChevronDown aria-hidden="true" /></button></h3><div id={answerId} role="region" aria-label={question} hidden={!isOpen}><p>{answer}</p></div></article> })}</div></div></section>

      <section className="cta-section"><div className="marketing-container cta-inner"><div><p className="eyebrow">{copy.cta.eyebrow}</p><h2>{copy.cta.title}</h2><p>{copy.cta.summary}</p></div><Link className="button button-light" to={ROUTES.auth.register}>{copy.nav.startFree} <ArrowRight size={18} aria-hidden="true" /></Link></div></section>
      <footer className="site-footer"><div className="marketing-container footer-row"><Link className="brand" to={ROUTES.home}><span className="brand-mark" aria-hidden="true"><ReceiptText size={18} /></span><span>Laco<span>Invoice</span></span></Link><p>{copy.cta.footer}</p><p>© {new Date().getFullYear()} Laconic. {copy.cta.rights}</p></div></footer>
      <button className={showScrollTop ? "scroll-top is-visible" : "scroll-top"} type="button" onClick={scrollToTop} aria-label="Back to top" tabIndex={showScrollTop ? 0 : -1}>
        <ArrowUp size={20} aria-hidden="true" />
      </button>
    </main>
  )
}
