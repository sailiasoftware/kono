const PDFDocument = require("pdfkit");
const axios = require('axios')

let RECORD_TYPE_TEXT = 'Invoice';
let DUE_OR_PAID_TEXT = 'Due';

async function createInvoice(docParams) {
    RECORD_TYPE_TEXT = docParams.isInvoice ? 'Invoice' : 'Receipt';
    DUE_OR_PAID_TEXT = docParams.isInvoice ? 'Due' : 'Paid';

    let doc = new PDFDocument({
        size: "A4",
        margin: 50
    });

    let expiryDateObject = null;
    if (docParams.expiry) {
        let dateParts = docParams.expiry.split("-");
        dateParts[0] = parseInt(dateParts[0]); // YYYY
        dateParts[0] = dateParts[0] < 2000 ? dateParts[0] + 2000 : dateParts[0];
        dateParts[1] = parseInt(dateParts[1]) - 1; // MM (indexing starts at 0)
        dateParts[2] = parseInt(dateParts[2]); // DD
        expiryDateObject = new Date(dateParts[0], dateParts[1], dateParts[2]);
    }
    const showPayNowButton = docParams.paynowLink && !(docParams.status == 'VOID' || docParams.status == 'PAID');

    generateTopAccent(doc, 7, docParams.accentColour);
    await generateHeader(doc, docParams);
    generateCustomerInformation(doc, docParams, expiryDateObject);
    const invoiceTableEndPosition = generateInvoiceTable(doc, docParams);
    if (showPayNowButton) {
        generatePayNowButton(doc, invoiceTableEndPosition + 30, docParams);
    }
    generateFooter(doc, docParams, expiryDateObject);

    return await getBase64(doc);

}

function generateTopAccent(doc, width, accentColour) {
    doc
        .strokeColor(accentColour)
        .lineWidth(width)
        .moveTo(0, 1)
        .lineTo(doc.page.width, 1)
        .stroke();
}

async function generateHeader(doc, docParams) {

    try {
        const logoData = await getLogo(docParams.companyInfo.logoUrl);
        doc.image(logoData, 50, 50, {
            fit: [100, 75],
            valign: 'top'
        });
    } catch (error) {
        doc.fontSize(24)
            .text(docParams.companyInfo.companyName, 50, 65)
    }

    doc
        .fillColor("#444444")
        .fontSize(10)
        .text(docParams.companyInfo.companyName, 200, 50, {
            align: "right"
        })
        .text(docParams.companyInfo.addressLine1, 200, 65, {
            align: "right"
        })
        .text(docParams.companyInfo.addressLine2, 200, 80, {
            align: "right"
        })
        .text(docParams.companyInfo.addressLine3, 200, 95, {
            align: "right"
        })
        .text(docParams.companyInfo.addressLine4, 200, 110, {
            align: "right"
        })
        .moveDown();
}

function generateCustomerInformation(doc, invoice, expiryDateObject) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text(RECORD_TYPE_TEXT, 50, 160);

    generateHrLine(doc, 185);

    const customerInformationTop = 200;
    doc
        .fontSize(10)
        .text(RECORD_TYPE_TEXT + " Number:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.invoice_nr, 150, customerInformationTop)
        .font("Helvetica")
        .text(RECORD_TYPE_TEXT + " Date:", 50, customerInformationTop + 15)
        .text(formatDate(new Date()), 150, customerInformationTop + 15)
        .text("Balance " + DUE_OR_PAID_TEXT + ":", 50, customerInformationTop + 30)
        .text(
            formatCurrency(invoice.subtotal - invoice.discount), 150, customerInformationTop + 30
        )
    let nextLineY = customerInformationTop + 45;
    if (invoice.status == 'VOID') {
        doc
            .text("Status: ", 50, nextLineY)
            .text("VOID", 150, nextLineY)
        nextLineY += 15;
    } else if (invoice.status == 'PAID') {
        doc
            .text("Status: ", 50, nextLineY)
            .text("PAID", 150, nextLineY)
        nextLineY += 15;
    } else if (expiryDateObject) {
        doc
            .text("Pay by: ", 50, nextLineY)
            .text(formatDate(expiryDateObject), 150, nextLineY)
        nextLineY += 15;
    }
    if (invoice.reference) {
        doc
            .text("Reference: ", 50, nextLineY)
            .text(invoice.reference, 150, nextLineY)
        nextLineY += 15;
    }
    if (invoice.taxNumber) {
        doc
            .text("VAT Number: ", 50, nextLineY)
            .text(invoice.taxNumber, 150, nextLineY)
        nextLineY += 15;
    }

    doc
        .font("Helvetica-Bold")
        .text(invoice.customerInfo.name, 300, customerInformationTop)
        .font("Helvetica")
        .text(invoice.customerInfo.addressLine1, 300, customerInformationTop + 15)
        .text(invoice.customerInfo.addressLine2, 300, customerInformationTop + 30)
        .text(invoice.customerInfo.addressLine3, 300, customerInformationTop + 45)
        .text(invoice.customerInfo.addressLine4, 300, customerInformationTop + 60)
        .moveDown();

    let sectionEndY = Math.max(customerInformationTop + 75, nextLineY);
    generateHrLine(doc, sectionEndY);
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
            limitTextLength(doc, product.name, 170),
            limitTextLength(doc, product.description, 100),
            formatCurrency(product.cost / product.quantity),
            product.quantity,
            formatCurrency(product.cost)
        );

        generateHrLine(doc, position + 20);
    }

    let totalInclVAT = invoice.subtotal - invoice.discount;
    let totalExclVAT = totalInclVAT/(1+invoice.taxRate)

    position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
        doc,
        position,
        "",
        "",
        "",
        "Subtotal",
        formatCurrency(invoice.subtotal)
    );

    position += 15;
    generateTableRow(
        doc,
        position,
        "",
        "",
        "",
        "Discount",
        formatCurrency(invoice.discount)
    );

    if (invoice.taxRate) {
        position += 15;
        generateTableRow(
            doc,
            position,
            "",
            "",
            "",
            `VAT (${invoice.taxRate*100}%)`,
            formatCurrency(totalInclVAT - totalExclVAT)
        );
    }

    position += 15;
    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        position,
        "",
        "",
        "",
        "Total" + (invoice.taxRate ? " Incl. VAT" : ""),
        formatCurrency(totalInclVAT)
    );
    doc.font("Helvetica");

    return position;
}

function generatePayNowButton(doc, y, docParams) {
    const buttonWidth = 75;
    const buttonHeight = 25;
    const buttonX = (doc.page.width - buttonWidth - 50); // Calculate the x position of the button
    const buttonY = y;
    const cornerRadius = 10; // Add this line to define the corner radius
    doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, cornerRadius).fillAndStroke(docParams.accentColour, docParams.accentColour);
    const linkUrl = docParams.paynowLink;
    if (linkUrl !== '#') {
        doc.link(buttonX, buttonY, buttonWidth, buttonHeight, linkUrl);
    }
    doc.fontSize(12).fillColor("#FFFFFF").text("Pay Now", buttonX, buttonY + 8, {
        width: buttonWidth,
        align: "center",
    });
    doc.fillColor("#444444");
}

function generateFooter(doc, docParams, expiryDateObject) {
    let footerText = '';
    if (docParams.status == 'VOID') {
        footerText = 'This document has been marked as VOID.';
    } else if (docParams.status == 'PAID') {
        footerText = 'This document has been marked as PAID.';
    } else if (expiryDateObject) {
        const dateString = expiryDateObject.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        footerText = "This document will become void if not paid by: " + dateString;
    }
    doc
        .fontSize(10)
        .text(
            footerText,
            50,
            780, {
                align: "center",
                width: 500
            }
        );
}


async function getLogo(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer'
    });
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
        .text(description, 230, y)
        .text(unitCost, 290, y, {
            width: 90,
            align: "right"
        })
        .text(quantity, 370, y, {
            width: 90,
            align: "right"
        })
        .text(lineTotal, 0, y, {
            align: "right"
        });
}

function limitTextLength(doc, text, width) {
    let textWidth = doc.widthOfString(text);
    let widthOfDots = doc.widthOfString('...');
    if (textWidth <= width) {
        return text;
    }
    while (textWidth + widthOfDots > width) {
        text = text.slice(0, -1);
        textWidth = doc.widthOfString(text);
        console.log(text + ' ' + (textWidth + widthOfDots));
    }
    text += '...';
    return text;
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