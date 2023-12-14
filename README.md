# Lambda Receipt and Invoice PDF Generator

This is a Lambda function that is used to generate PDF documents for receipts and invoices. The function is to be triggered by an API gateway POST request.
If the url to the company logo is invalid (or there is some other issue getting the logo) then the company name will be used instead.

![Example PDF document](https://i.ibb.co/9Zd8tsH/Screenshot-2023-12-13-131810.png)

### Example request body
```
"body":{
       "isInvoice":true,
       "companyInfo":{
          "logoUrl":"sailiaLogo",
          "companyName":"Sailia Limited",
          "addressLine1":"123  Office Building House",
          "addressLine2":"Avenue Road",
          "addressLine3":"York",
          "addressLine4":"North Yorkshire, DS8 6WQ"
       },
       "customerInfo":{
          "name":"Tim Smith",
          "addressLine1":"1234 Address Street",
          "addressLine2":"Leeds",
          "addressLine3":"North Yorkshire, R23 5QUW"
       },
       "products":[
          {
             "name":"RYA Start Sailing",
             "description":"Sailing",
             "quantity":2,
             "cost":6000
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
       "invoice_nr":1234
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
