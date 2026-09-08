from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import BaseDocTemplate, Frame, Image, PageBreak, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.platypus.flowables import Flowable

OUT = Path(r"D:\Laconic\dev\invoice\laco-invoice\output\pdf\Laco_Invoice_Marketing_Overview.pdf")
PRODUCT_SCREENSHOT = Path(r"C:\Users\thant\AppData\Local\Temp\codex-clipboard-b08248e9-15f5-413a-9bcd-7d81ddf20134.png")
OUT.parent.mkdir(parents=True, exist_ok=True)

RED = HexColor("#D40000")
RED_DARK = HexColor("#AB0000")
INK = HexColor("#17201F")
MUTED = HexColor("#60706B")
LINE = HexColor("#DCE4E0")
CREAM = HexColor("#F8F7F2")
GREEN = HexColor("#1D5147")
PALE_RED = HexColor("#FDE8E8")
PALE_GREEN = HexColor("#EAF4F0")
PALE_GOLD = HexColor("#FFF4D9")
PAGE_W, PAGE_H = A4

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverBrand", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=34, leading=38, textColor=INK, alignment=TA_CENTER, spaceAfter=18))
styles.add(ParagraphStyle(name="CoverTag", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=15, leading=22, textColor=GREEN, alignment=TA_CENTER, spaceAfter=28))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontName="Helvetica", fontSize=11, leading=17, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="H1", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=INK, spaceAfter=8))
styles.add(ParagraphStyle(name="H2", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=INK, spaceBefore=7, spaceAfter=5))
styles.add(ParagraphStyle(name="Body", parent=styles["Normal"], fontName="Helvetica", fontSize=9.7, leading=14.2, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="Small", parent=styles["Normal"], fontName="Helvetica", fontSize=8.3, leading=11, textColor=MUTED))
styles.add(ParagraphStyle(name="MarketingBullet", parent=styles["Normal"], fontName="Helvetica", fontSize=9.2, leading=13.2, textColor=INK, leftIndent=11, firstLineIndent=-8, spaceAfter=3))
styles.add(ParagraphStyle(name="Kicker", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.6, leading=11, textColor=RED, uppercase=True, tracking=1.4, spaceAfter=5))
styles.add(ParagraphStyle(name="CardTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=INK, spaceAfter=4))
styles.add(ParagraphStyle(name="CardBody", parent=styles["Normal"], fontName="Helvetica", fontSize=8.7, leading=12, textColor=MUTED))
styles.add(ParagraphStyle(name="CTA", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=18, leading=23, textColor=INK, spaceAfter=7))

def p(text, style="Body"):
    return Paragraph(text, styles[style])

class Rule(Flowable):
    def __init__(self, color=RED, width=120*mm, thickness=1.2):
        super().__init__(); self.color=color; self.width=width; self.thickness=thickness; self.height=6
    def draw(self):
        self.canv.setStrokeColor(self.color); self.canv.setLineWidth(self.thickness); self.canv.line(0, 3, self.width, 3)

class ProductMockup(Flowable):
    def __init__(self, width=165*mm, height=84*mm):
        super().__init__(); self.width=width; self.height=height
    def draw(self):
        c=self.canv; w=self.width; h=self.height
        c.setFillColor(HexColor("#FFFFFF")); c.setStrokeColor(GREEN); c.setLineWidth(3); c.roundRect(0,0,w,h,6,fill=1,stroke=1)
        c.setFillColor(HexColor("#FBFCFC")); c.rect(0,h-13*mm,w,13*mm,fill=1,stroke=0)
        c.setFillColor(RED); c.roundRect(5*mm,h-9*mm,6*mm,6*mm,1.4*mm,fill=1,stroke=0)
        c.setFillColor(GREEN); c.setFont("Helvetica-Bold",7); c.drawString(13*mm,h-6.3*mm,"LacoInvoice")
        c.setFillColor(HexColor("#F1F4F3")); c.rect(0,0,12*mm,h-13*mm,fill=1,stroke=0)
        c.setFillColor(RED); c.roundRect(4*mm,h-23*mm,4*mm,1.3*mm,.6*mm,fill=1,stroke=0)
        c.setFillColor(MUTED)
        for y in [h-30*mm,h-37*mm,h-44*mm,h-51*mm]: c.roundRect(4*mm,y,4*mm,1.3*mm,.6*mm,fill=1,stroke=0)
        x=18*mm; c.setFillColor(MUTED); c.setFont("Helvetica",6.5); c.drawString(x,h-23*mm,"Overview")
        c.setFillColor(INK); c.setFont("Helvetica-Bold",10); c.drawString(x,h-30*mm,"Good morning, James")
        c.setFillColor(RED); c.roundRect(w-33*mm,h-33*mm,24*mm,7*mm,1.5*mm,fill=1,stroke=0); c.setFillColor(white); c.setFont("Helvetica-Bold",5.7); c.drawCentredString(w-21*mm,h-29.1*mm,"+ Create invoice")
        cards=[("Orders this month","1,284","+18.4%"),("Invoices issued","1,109","+12.6%"),("Document total","THB 842,590","+9.2%")]
        card_w=(w-25*mm)/3
        for i,(a,b,d) in enumerate(cards):
            cx=x+i*(card_w+3*mm); cy=h-57*mm
            c.setStrokeColor(LINE); c.setFillColor(white); c.roundRect(cx,cy,card_w,18*mm,2*mm,fill=1,stroke=1)
            c.setFillColor(MUTED); c.setFont("Helvetica",5.8); c.drawString(cx+3*mm,cy+12.5*mm,a)
            c.setFillColor(INK); c.setFont("Helvetica-Bold",8.3); c.drawString(cx+3*mm,cy+8*mm,b)
            c.setFillColor(HexColor("#27816A")); c.setFont("Helvetica",5.5); c.drawString(cx+3*mm,cy+3.7*mm,d)
        ly=8*mm; lx=x; lw=w-27*mm
        c.setStrokeColor(LINE); c.setFillColor(white); c.roundRect(lx,ly,lw,19*mm,2*mm,fill=1,stroke=1)
        c.setFillColor(HexColor("#F7F9F8")); c.rect(lx,ly+14*mm,lw,5*mm,fill=1,stroke=0)
        c.setFillColor(INK); c.setFont("Helvetica-Bold",5.9); c.drawString(lx+3*mm,ly+16.5*mm,"Recent orders")
        c.setFillColor(RED); c.setFont("Helvetica",5.5); c.drawString(lx+lw-22*mm,ly+16.5*mm,"View all")
        for j,(order,status,amt) in enumerate([("TK-93251084","Tax invoice ready","THB 1,290"),("SP-21904822","Tax invoice ready","THB 890"),("LZ-55128491","Processing","THB 2,450")]):
            yy=ly+10.8*mm-j*4.1*mm
            c.setFillColor(HexColor("#45AA7E")); c.circle(lx+3*mm,yy+.6*mm,.8*mm,fill=1,stroke=0)
            c.setFillColor(MUTED); c.setFont("Helvetica",5.5); c.drawString(lx+6*mm,yy,order)
            c.setFillColor(HexColor("#27816A")); c.drawString(lx+55*mm,yy,status)
            c.setFillColor(INK); c.setFont("Helvetica-Bold",5.5); c.drawRightString(lx+lw-3*mm,yy,amt)

def feature_card(title, text, icon, color):
    data=[[p(f'<font color="{color}">{icon}</font>', "CardTitle")], [p(title,"CardTitle")], [p(text,"CardBody")]]
    t=Table(data, colWidths=[55*mm], rowHeights=[8*mm,10*mm,28*mm])
    t.setStyle(TableStyle([("BOX",(0,0),(-1,-1),0.7,LINE),("BACKGROUND",(0,0),(-1,-1),white),("LEFTPADDING",(0,0),(-1,-1),5*mm),("RIGHTPADDING",(0,0),(-1,-1),5*mm),("TOPPADDING",(0,0),(-1,-1),3*mm),("BOTTOMPADDING",(0,0),(-1,-1),2*mm),("VALIGN",(0,0),(-1,-1),"TOP")]))
    return t

def footer(canvas, doc):
    canvas.saveState(); canvas.setStrokeColor(LINE); canvas.setLineWidth(.4); canvas.line(18*mm,14*mm,PAGE_W-18*mm,14*mm)
    canvas.setFillColor(MUTED); canvas.setFont("Helvetica",7.4)
    canvas.drawString(18*mm,9.5*mm,"Laco Invoice - Marketing Overview & Pricing")
    canvas.drawRightString(PAGE_W-18*mm,9.5*mm,f"Page {doc.page}")
    canvas.restoreState()

doc=BaseDocTemplate(str(OUT),pagesize=A4,leftMargin=18*mm,rightMargin=18*mm,topMargin=18*mm,bottomMargin=21*mm)
frame=Frame(doc.leftMargin,doc.bottomMargin,doc.width,doc.height,id="main")
doc.addPageTemplates([__import__("reportlab.platypus",fromlist=["PageTemplate"]).PageTemplate(id="brand",frames=[frame],onPage=footer)])
story=[]

# Cover
story += [Spacer(1,12*mm),p('<font size="8" color="#D40000"><b>Laco</b></font><font size="8" color="#17201F"><b>Invoice</b></font>',"CoverSub"),Spacer(1,22*mm),p('<font color="#17201F">Laco</font><font color="#D40000">Invoice</font>',"CoverBrand"),Rule(RED,170*mm,1.3),Spacer(1,8*mm),p("Every marketplace order,<br/>invoice ready.","CoverTag"),Spacer(1,5*mm),p("Marketplace invoicing for growing online businesses","CoverSub"),Spacer(1,16*mm),p("Marketing Overview & Pricing Guide","CoverSub"),Spacer(1,4*mm),p("laco-invoice","CoverSub"),PageBreak()]

# What is / problem / solution
story += [p("MARKETPLACE OPERATIONS, MADE CLEAR","Kicker"),p("What is Laco Invoice?","H1"),p("Laco Invoice brings marketplace orders, tax invoices, receipts, and finance handoffs into one organised workspace. Operations teams keep orders current; finance teams receive clean, consistent documents and voucher-ready information."),Rule(RED,170*mm,.8),Spacer(1,5*mm),p("The problem","H2"),p("Marketplace sellers often move between seller portals, spreadsheets, manual document files, and finance requests. The result is repeated work, missing context, and slower month-end preparation."),
    Table([[p("<b>Orders are scattered</b><br/>Teams search multiple marketplaces and files before they can act.","CardBody"),p("<b>Documents take time</b><br/>Issuing tax invoices and receipts one by one creates avoidable admin.","CardBody"),p("<b>Finance starts late</b><br/>PDFs and voucher information arrive without a consistent handoff.","CardBody")]],colWidths=[56*mm]*3,style=[("BOX",(0,0),(-1,-1),.6,LINE),("INNERGRID",(0,0),(-1,-1),.6,LINE),("BACKGROUND",(0,0),(-1,-1),CREAM),("LEFTPADDING",(0,0),(-1,-1),5*mm),("RIGHTPADDING",(0,0),(-1,-1),5*mm),("TOPPADDING",(0,0),(-1,-1),6*mm),("BOTTOMPADDING",(0,0),(-1,-1),6*mm)]),Spacer(1,8*mm),p("The Laco Invoice approach","H2"),p("Connect stores, manage orders in one view, issue documents with consistent VAT treatment, and export the records finance needs. Laco Invoice does not need to depend on an ERP response during everyday invoice work."),
    *[p(f"• {x}","MarketingBullet") for x in ["One connected workspace for marketplace order and document work.","Tax invoices and receipts with sequential document numbering and 7% VAT support.","PDF download and bulk ZIP export for a cleaner handoff to customers, finance, and auditors.","Voucher workflow preparation that can be reviewed before CSV, Excel, or later API exchange with ERP."]],PageBreak()]

# Features / marketplace
story += [p("CORE PRODUCT CAPABILITIES","Kicker"),p("Less chasing. More done.","H1"),p("A practical daily workflow for marketplace operations and finance."),Spacer(1,4*mm),Table([[feature_card("See every order in one place","Keep marketplace orders searchable, filterable, and ready for action in one central workspace.","01",RED),feature_card("Create documents in moments","Generate tax invoices and receipts with consistent numbering and VAT already applied.","02",HexColor("#B2760E")),feature_card("Keep finance moving","Export individual PDFs or a bulk ZIP, then prepare information for ERP voucher workflows.","03",GREEN)]],colWidths=[56*mm]*3),Spacer(1,10*mm),p("Built for marketplace teams","H2"),p("Laco Invoice is designed around the day-to-day needs of sellers operating across TikTok Shop, Shopee, Lazada, and Amazon. Marketplace availability and configuration should be confirmed for each customer rollout."),Spacer(1,5*mm),Table([[p("<b>TikTok Shop</b><br/>Bring completed orders into a clearer invoice workflow.","CardBody"),p("<b>Shopee</b><br/>Keep document preparation aligned with marketplace activity.","CardBody"),p("<b>Lazada</b><br/>Reduce manual file handling at month end.","CardBody"),p("<b>Amazon</b><br/>Support a unified view as channels grow.","CardBody")]],colWidths=[42*mm]*4,style=[("BOX",(0,0),(-1,-1),.6,LINE),("INNERGRID",(0,0),(-1,-1),.6,LINE),("BACKGROUND",(0,0),(-1,-1),white),("LEFTPADDING",(0,0),(-1,-1),4*mm),("RIGHTPADDING",(0,0),(-1,-1),4*mm),("TOPPADDING",(0,0),(-1,-1),6*mm),("BOTTOMPADDING",(0,0),(-1,-1),6*mm)]),PageBreak()]

# Workflow
story += [p("A SIMPLE FLOW","Kicker"),p("From order to ready-to-send document.","H1"),p("Laco Invoice keeps the work moving without adding another complicated process."),Spacer(1,4*mm)]
steps=[("01","Connect your store","Link a marketplace storefront and bring orders into Laco Invoice."),("02","Keep orders current","Run a sync when you need it, with automatic syncing available for a more current order view."),("03","Issue the document","Open an order and create a tax invoice or receipt PDF."),("04","Share or archive","Print, download, or export individual documents and bulk ZIP packages."),("05","Keep finance moving","Use organised invoice records as a starting point for ERP voucher processing.")]
for n,title,desc in steps:
    story += [Table([[p(f'<font color="#D40000"><b>{n}</b></font>',"CardTitle"),p(title,"CardTitle"),p(desc,"CardBody")]],colWidths=[18*mm,45*mm,105*mm],style=[("LINEABOVE",(0,0),(-1,0),.7,LINE),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),4*mm),("TOPPADDING",(0,0),(-1,-1),4*mm),("BOTTOMPADDING",(0,0),(-1,-1),4*mm),("VALIGN",(0,0),(-1,-1),"TOP")])]
story += [Spacer(1,6*mm),p("A cleaner ERP handoff","H2"),p("ERP master data such as items, vendors, and account codes can be synchronised into Laco Invoice by CSV or Excel first, then by scheduled API sync later. Voucher preparation reads local synced data, so finance does not wait for ERP while working."),PageBreak()]

# mockup + audience
product_image = Image(str(PRODUCT_SCREENSHOT), width=158*mm, height=98*mm)
story += [p("ONE CLEAR WORKSPACE","Kicker"),p("Designed for confidence at a glance.","H1"),p("A shared operational view gives sales operations and finance the same starting point."),Spacer(1,6*mm),product_image,Spacer(1,7*mm),p("Who Laco Invoice is for","H2"),p("Thai and Southeast Asia marketplace sellers, growing multi-channel teams, and finance functions that want a more organised path from sales activity to invoices, receipts, and voucher preparation."),Spacer(1,3*mm),Table([[p("<b>Operations teams</b><br/>Spend less time searching portals and preparing documents.","CardBody"),p("<b>Finance teams</b><br/>Receive clearer records, PDFs, and voucher-ready data.","CardBody"),p("<b>Growing sellers</b><br/>Start with one store and expand capacity when needed.","CardBody")]],colWidths=[56*mm]*3,style=[("BOX",(0,0),(-1,-1),.6,LINE),("INNERGRID",(0,0),(-1,-1),.6,LINE),("BACKGROUND",(0,0),(-1,-1),PALE_GREEN),("LEFTPADDING",(0,0),(-1,-1),5*mm),("RIGHTPADDING",(0,0),(-1,-1),5*mm),("TOPPADDING",(0,0),(-1,-1),5*mm),("BOTTOMPADDING",(0,0),(-1,-1),5*mm)]),Spacer(1,7*mm),p("Sales pitch","H2"),p("Laco Invoice helps marketplace sellers move from completed order to professional tax invoice or receipt in one connected workflow. Your team can search orders, create documents, export PDFs in bulk, and give finance a cleaner start for voucher processing."),PageBreak()]

# Pricing
story += [p("STRAIGHTFORWARD PRICING","Kicker"),p("A plan that grows with your business.","H1"),p("Proposed public pricing for review. Prices are in Thai baht, exclude VAT, and are billed monthly unless stated otherwise."),Spacer(1,5*mm)]
headers=[p("Starter<br/><font size=8>One growing store</font>","CardTitle"),p("Growth<br/><font size=8>Multi-channel teams</font>","CardTitle"),p("Scale<br/><font size=8>Established operations</font>","CardTitle"),p("Enterprise<br/><font size=8>Tailored workflows</font>","CardTitle")]
prices=[p("<b><font size=18>THB 990</font></b><br/>per month","Body"),p("<b><font size=18>THB 2,490</font></b><br/>per month","Body"),p("<b><font size=18>THB 4,990</font></b><br/>per month","Body"),p("<b><font size=16>Contact sales</font></b><br/>Custom terms","Body")]
features=[p("• 1 marketplace store<br/>• 300 invoices / month<br/>• Order sync and document PDFs<br/>• Product and SKU management<br/>• Email support","CardBody"),p("• 3 marketplace stores<br/>• 1,500 invoices / month<br/>• Automatic order sync<br/>• Bulk PDF ZIP export<br/>• ERP voucher workflow support","CardBody"),p("• 10 marketplace stores<br/>• 5,000 invoices / month<br/>• Multi-user team access<br/>• Advanced export workflows<br/>• Priority support","CardBody"),p("• Custom stores and volume<br/>• Tailored ERP and workflow configuration<br/>• Onboarding and training<br/>• Dedicated success contact","CardBody")]
pricing=Table([headers,prices,features],colWidths=[42*mm]*4,rowHeights=[22*mm,25*mm,58*mm])
pricing.setStyle(TableStyle([("BACKGROUND",(0,0),(0,0),HexColor("#F6F7F7")),("BACKGROUND",(1,0),(1,0),PALE_RED),("BACKGROUND",(2,0),(2,0),PALE_GREEN),("BACKGROUND",(3,0),(3,0),PALE_GOLD),("BOX",(0,0),(-1,-1),.8,INK),("INNERGRID",(0,0),(-1,-1),.6,LINE),("LEFTPADDING",(0,0),(-1,-1),4*mm),("RIGHTPADDING",(0,0),(-1,-1),4*mm),("TOPPADDING",(0,0),(-1,-1),4*mm),("BOTTOMPADDING",(0,0),(-1,-1),4*mm),("VALIGN",(0,0),(-1,-1),"TOP")]))
story += [pricing,Spacer(1,7*mm),p("What is included","H2"),*[p(f"• {x}","MarketingBullet") for x in ["Tax invoices and receipts with 7% VAT support.","Searchable orders and structured invoice records.","Start with the capacity you need, then add marketplace stores or invoice capacity as the business grows.","Annual billing saves 15%. Additional store: THB 390 per month. Additional invoice capacity: THB 0.90 per invoice."]],Spacer(1,7*mm),p("Ready to make invoice work easier?","CTA"),Rule(RED,170*mm,.8),Spacer(1,4*mm),p("Start with the right store and invoice capacity for your current operation. Talk to the Laco Invoice team about a tailored rollout, onboarding, or ERP workflow planning.","Body"),Spacer(1,4*mm),p("Laco Invoice | Marketplace invoicing, made clear.","CoverSub")]

doc.build(story)
print(OUT)
