const createInvoice = require('./createInvoice')
const saveToS3 = require('./saveToS3');
require('dotenv').config();
const normaliseAddress = require('./normaliseAddress')

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
    invoice_nr: 1234,
    paynowLink: "https://sailia.co.uk/",
};

Function returns S3 key to the pdf file
*/

const BUCKET = process.env.BUCKET;
const BASE_PATH = process.env.BASE_PATH;

exports.handler = async function (event) {

    //const body = JSON.parse(event.body);
    const body = event.body;
    body.isInvoice = body.isInvoice || false;
    body.discount =  body.discount || 0;
    body.status = !body.isInvoice ? 'PAID' : body.status;
    body.reference = body.reference || '';
    body.accentColour =  body.accentColour || '#19a6eb';
    body.customerInfo = normaliseAddress(body.customerInfo);
    body.companyInfo = normaliseAddress(body.companyInfo);

    const base64PDF = await createInvoice(body);
    console.log(base64PDF);
    
    const key = generateS3Key(body.invoice_nr);
    const s3Response = await saveToS3(BUCKET, key, base64PDF);

    return {
        "isBase64Encoded": false,
        "statusCode": 200,
        "headers": { },
        "body": s3Response.Key,
    };
};

function generateS3Key(objectIdentifier) {
  let key = BASE_PATH;
  if (!key.endsWith('/')) {
    key += '/';
  }
  key += objectIdentifier;
  key += '.pdf'
  return key;
}