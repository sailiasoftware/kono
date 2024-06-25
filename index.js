const createInvoice = require('./createInvoice')
const saveToS3 = require('./saveToS3');
require('dotenv').config();
const normaliseAddress = require('./normaliseAddress')

/*Example request body:
const body = {
    "isInvoice":true,
    "companyInfo":{
        "logoUrl":"sailiaLogo",
        "companyName":"Sailia Limited",
        "addressLine1":"123  Office Building House",  // addressLine1 to addressLine 4 are optional
        "addressLine2":"Avenue Road",
        "addressLine3":"York",
        "addressLine4":"North Yorkshire, DS8 6WQ"
    },
    "customerInfo":{
        "name":"Tim Smith",
        "addressLine1":"1234 Address Street",  // addressLine1 to addressLine 4 are optional
        "addressLine2":"Leeds",
        "addressLine3":"North Yorkshire, R23 5QUW"
        "addressLine4": ""
    },
    "products":[
        {
            "name":"RYA Start Sailing",
            "description":"Sailing",
            "quantity":2,
            "cost":6000  // This is the total cost for the product (i.e. NOT UNIT PRICE)
        },
        {
            "name":"Starter session",
            "description":"Wind Surfing",
            "quantity":1,
            "cost":2000
        },
        {
            "name":"Starter session",
            "description":"Wind Surfing",
            "quantity":1,
            "cost":2000
        }
    ],
    "subtotal":10000,
    "discount":950,
    "tenantNet": 8000,      // (optional). This is what the tenant will receive after the discount, stripe and sailia fees
                            // If not present, this will be calculated as subtotal-discount
    "invoice_nr":00001,
    "paynowLink": "www.example.com",   // (optional). Link to payment. If present, a blue 'Pay Now' button will appear on the invoice
                                      // If set to '#', the button will appear but will not be active. This is for display purposes,
    "expiry": "2024-03-22",  // YYYY-MM-DD
    "taxRate": 0.2,
    "taxNumber": "GB123456"
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
    body.tenantNet = body.tenantNet || (body.subtotal - body.discount);

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