# Lambda Receipt and Invoice PDF Generator

This is a Lambda function that is used to generate PDF documents for receipts and invoices. The function is to be triggered by an API gateway POST request.
If the url to the company logo is invalid (or there is some other issue getting the logo) then the company name will be used instead.

[![Example of pdf document](https://iili.io/J51MIj4.md.png)](https://freeimage.host/i/J51MIj4)

### Example request body
```
"body":{
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
       "subtotal":8000,
       "discount":950,
       "invoice_nr":1234,
       "paynowLink": "www.example.com",   // (optional). Link to payment. If present, a blue 'Pay Now' button will appear on the invoice
                                          // If set to '#', the button will appear but will not be active. This is for display purposes,
       "expiry": "2024-03-22"  // YYYY-MM-DD
    }
```

### Example response
```
{
       statusCode: 200,
       s3Key: 'BASE_PATH/invoice_nr.pdf' // Where BASE_PATH is set in .env and invoice_nr is defined in request body
}
```

### Environment variables
- BUCKET - this is the S3 bucket that you would like to insert the generated pdf documents into
- BASE_PATH - this is the path within the S3 bucket that you would like to place the generated pdf documents into (eg 'pdfs/receipts-and-invoices'). NOTE: There should be no '/' at the beginning or end of this variable

### Future developement
When developing this function in the furture, these are the steps that need to be taken:
- CLone the repo
- Run ```npm install``` to install the dependencies
- If uploading to lambda using zip file, make sure that the node_modules directory is included in the zip file
You should theoretically be able to run ```sam local invoke -e event.json``` if you have SAM CLI installed, but it seems to run out of memory when run locally
