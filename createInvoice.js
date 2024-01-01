const PDFDocument = require("pdfkit");
const axios = require('axios')

let RECORD_TYPE_TEXT = 'Invoice';
let DUE_OR_PAID_TEXT = 'Due';
let ACCENT_COLOUR = '#19a6eb';

async function createInvoice(docParams) {
  RECORD_TYPE_TEXT = docParams.isInvoice ? 'Invoice' : 'Receipt';
  DUE_OR_PAID_TEXT = docParams.isInvoice ? 'Due' : 'Paid';

  let doc = new PDFDocument({ size: "A4", margin: 50 });

  generateTopAccent(doc, 7);
  await generateHeader(doc, docParams);
  generateCustomerInformation(doc, docParams);
  const invoiceTableEndPosition = generateInvoiceTable(doc, docParams);
  if (docParams.paynowLink) {
    generatePayNowButton(doc, invoiceTableEndPosition+30, docParams);
  }

  return await getBase64(doc);
    
}

function generateTopAccent(doc, width) {
    doc
      .strokeColor(ACCENT_COLOUR)
      .lineWidth(width)
      .moveTo(0, 1)
      .lineTo(doc.page.width, 1)
      .stroke();
}

async function generateHeader(doc, docParams) {

  try {
    const logoData = await getLogo(docParams.companyInfo.logoUrl);
    doc.image(logoData, 50, 50, { width: 150 })
  } catch (error) {
    doc.fontSize(24)
      .text(docParams.companyInfo.companyName, 50, 65)
  }

  doc
      .fillColor("#444444")
      .fontSize(10)
      .text(docParams.companyInfo.companyName, 200, 50, { align: "right" })
      .text(docParams.companyInfo.addressLine1, 200, 65, { align: "right" })
      .text(docParams.companyInfo.addressLine2, 200, 80, { align: "right" })
      .text(docParams.companyInfo.addressLine3, 200, 95, { align: "right" })
      .text(docParams.companyInfo.addressLine4, 200, 110, { align: "right" })
      .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  doc
        .fillColor("#444444")
        .fontSize(20)
        .text(RECORD_TYPE_TEXT, 50, 160);

        generateHrLine(doc, 185);
  
    const customerInformationTop = 200;
    doc
        .fontSize(10)
        .text(RECORD_TYPE_TEXT+" Number:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.invoice_nr, 150, customerInformationTop)
        .font("Helvetica")
        .text(RECORD_TYPE_TEXT+" Date:", 50, customerInformationTop + 15)
        .text(formatDate(new Date()), 150, customerInformationTop + 15)
        .text("Balance "+DUE_OR_PAID_TEXT+":", 50, customerInformationTop + 30)
        .text(
            formatCurrency(invoice.subtotal - invoice.discount), 150, customerInformationTop + 30
        )
    
        .font("Helvetica-Bold")
        .text(invoice.customerInfo.name, 300, customerInformationTop)
        .font("Helvetica")
        .text(invoice.customerInfo.addressLine1, 300, customerInformationTop + 15)
        .text(invoice.customerInfo.addressLine2, 300, customerInformationTop + 30)
        .text(invoice.customerInfo.addressLine3, 300, customerInformationTop + 45)
        .text(invoice.customerInfo.addressLine4, 300, customerInformationTop + 60)
        .moveDown();
    
        generateHrLine(doc, customerInformationTop + 75);
}

function generateInvoiceTable(doc, invoice) {
    // Generates the invoice table and the returns the y position of the end of the table

    let i;
    const invoiceTableTop = 330;
  
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      invoiceTableTop,
      "Item",
      "Description",
      "Unit Cost",
      "Quantity",
      "Line Total"
    );
    generateHrLine(doc, invoiceTableTop + 20);
    doc.font("Helvetica");
  
    for (i = 0; i < invoice.products.length; i++) {
      const product = invoice.products[i];
      product.quantity = product.quantity || 1;
      const position = invoiceTableTop + (i + 1) * 30;
      generateTableRow(
        doc,
        position,
        product.name,
        product.description,
        formatCurrency(product.cost / product.quantity),
        product.quantity,
        formatCurrency(product.cost)
      );
  
      generateHrLine(doc, position + 20);
    }
  
    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      subtotalPosition,
      "",
      "",
      "Subtotal",
      "",
      formatCurrency(invoice.subtotal)
    );
  
    const discountPosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      discountPosition,
      "",
      "",
      "Discount",
      "",
      formatCurrency(invoice.discount)
    );
  
    const duePosition = discountPosition + 25;
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      duePosition,
      "",
      "",
      "Balance "+DUE_OR_PAID_TEXT,
      "",
      formatCurrency(invoice.subtotal - invoice.discount)
    );
    doc.font("Helvetica");
    return duePosition;
}

function generatePayNowButton(doc, y, docParams) {
    const buttonWidth = 75;
    const buttonHeight = 25;
    const buttonX = (doc.page.width - buttonWidth - 50) ; // Calculate the x position of the button
    const buttonY = y;
    const cornerRadius = 10; // Add this line to define the corner radius
    doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, cornerRadius).fillAndStroke(ACCENT_COLOUR, ACCENT_COLOUR);
    const linkUrl = docParams.paynowLink;
    if (linkUrl !== '#') {
    doc.link(buttonX, buttonY, buttonWidth, buttonHeight, linkUrl);
    }
    doc.fontSize(12).fillColor("#FFFFFF").text("Pay Now", buttonX, buttonY + 8, {
        width: buttonWidth,
        align: "center",
    });
}



async function getLogo(url) {
    const response = await axios.get(url, {responseType: 'arraybuffer'});
    return Buffer.from(response.data);
}

function generateHrLine(doc, y) {
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
}

function generateTableRow(
    doc,
    y,
    name,
    description,
    unitCost,
    quantity,
    lineTotal
  ) {
    doc
      .fontSize(10)
      .text(name, 50, y)
      .text(description, 150, y)
      .text(unitCost, 280, y, { width: 90, align: "right" })
      .text(quantity, 370, y, { width: 90, align: "right" })
      .text(lineTotal, 0, y, { align: "right" });
}

function formatCurrency(pence) {
    return "£" + (pence / 100).toFixed(2);
}

function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
  
    return day + "/" + month + "/" + year;
}

async function getBase64(doc) {
    return new Promise((resolve, reject) => {
        doc.end();
        const chunks = [];
        doc.on('data', (chunk) => {
            chunks.push(chunk)
        });
        doc.on('end', () => {
            let result = Buffer.concat(chunks)
            result = result.toString('base64')
            resolve(result)
        });
        doc.on('error', (error) => {
            reject(error)
        })
    });
}

module.exports = createInvoice;