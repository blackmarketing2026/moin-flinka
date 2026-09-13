const PDFDocument = require("pdfkit");
const { money, getSuffix, PLATE_TYPE_LABELS, prices } = require("./plate-order");

function formatDate(date) {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function buildReceiptPdf({ session, order, pricing }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const plateLabel = `${order.city} ${order.letters} ${order.digits}${getSuffix(order)}`;
    const productLabel = PLATE_TYPE_LABELS[order.plateType] || order.plateType;
    const orderDate = session.created ? new Date(session.created * 1000) : new Date();

    doc
      .fillColor("#092954")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Moin Flinka", 50, 50)
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#516a86")
      .text("Express Kfz-Zulassung & Schilder Hamburg", 50, 74)
      .text("info@moin-flinka.de · +49 1590 6808767", 50, 88);

    doc
      .fillColor("#092954")
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Bestellbestätigung", 50, 130);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#203a5e")
      .text(`Bestellnummer: ${session.id}`, 50, 155)
      .text(`Datum: ${formatDate(orderDate)}`, 50, 170);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#092954")
      .text("Kunde", 50, 200)
      .font("Helvetica")
      .fillColor("#203a5e")
      .fontSize(10)
      .text(order.name, 50, 216)
      .text(order.street, 50, 230)
      .text(`${order.postcode} ${order.town}`, 50, 244)
      .text(order.email, 50, 258);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#092954")
      .text("Produkt", 300, 200)
      .font("Helvetica")
      .fillColor("#203a5e")
      .fontSize(10)
      .text(productLabel, 300, 216)
      .font("Helvetica-Bold")
      .text("Kennzeichen", 300, 236)
      .font("Helvetica")
      .text(plateLabel, 300, 252);

    let y = 300;
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#dcebf5")
      .stroke();
    y += 16;

    const rows = [
      ["Grundpreis", money(pricing.basePriceCents)],
      ...(order.carbon ? [["Carbon-Optik", money(prices.carbon)]] : []),
      ...(order.environmentSticker ? [["Grüne Umweltplakette", money(prices.environmentSticker)]] : []),
      [
        order.delivery === "express" ? "Lieferung: DHL-Express" : "Lieferung: Klassischer DHL-Versand",
        money(pricing.deliveryPriceCents),
      ],
    ];

    doc.fontSize(10).font("Helvetica");
    rows.forEach(([label, value]) => {
      doc.fillColor("#203a5e").text(label, 50, y);
      doc.text(value, 400, y, { width: 145, align: "right" });
      y += 18;
    });

    y += 6;
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#dcebf5")
      .stroke();
    y += 12;

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#092954")
      .text("Gesamtpreis", 50, y)
      .text(money(pricing.totalPriceCents), 400, y, { width: 145, align: "right" });
    y += 30;

    if (order.testMode) {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#b45309")
        .text("Hinweis: Dies war eine Testbestellung.", 50, y);
      y += 20;
    }

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#a9c2d8")
      .text(
        "Dies ist eine automatisch erstellte Bestellbestätigung ohne separaten Steuerausweis. Deine offizielle Rechnung erhältst du zusätzlich per E-Mail, sobald sie vorliegt.",
        50,
        y,
        { width: 495 }
      );

    doc.end();
  });
}

module.exports = { buildReceiptPdf };
