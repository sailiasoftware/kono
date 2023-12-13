const createInvoice = require('./createInvoice')
const saveToS3 = require('./saveToS3');
require('dotenv').config();

/*Example request body:
const body = {
    isInvoice: true,
    companyInfo: {
      logoUrl: sailiaLogo,
      companyName: "Sailia Limited",
      addressLine1: "123  Office Building House",
      addressLine2: "Avenue Road",
      addressLine3: "York",
      addressLine4: "North Yorkshire, DS8 6WQ",
    },
    customerInfo: {
      name: "Tim Smith",
      addressLine1: "1234 Address Street",
      addressLine2: "Leeds",
      addressLine3: "North Yorkshire, R23 5QUW",
    },
    products: [
      {
        name: "RYA Start Sailing",
        description: "Sailing",
        quantity: 2,
        cost: 6000
      },
      {
        name: "Starter session",
        description: "Wind Surfing",
        quantity: 1,
        cost: 2000
      },
      {
        name: "Starter session",
        description: "Wind Surfing",
        quantity: 1,
        cost: 2000
      }
    ],
    subtotal: 8000,
    //discount: 950,
    invoice_nr: 1234
};

Function returns S3 key to the pdf file
*/

const BUCKET = process.env.BUCKET;

exports.handler = async function (event) {

    const body = event.body;
    body.isInvoice = body.isInvoice || false;
    body.discount =  body.discount || 0;

    const base64PDF = await createInvoice(body);

    console.log(base64PDF);

    const s3Response = await saveToS3(BUCKET, "pdfs/testInvoice1.pdf", base64PDF);

    return {
        statusCode: 200,
        s3Key: s3Response.location
    };

};
  