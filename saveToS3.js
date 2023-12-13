const AWS = require('aws-sdk')

const putObjectToS3 = function(bucket, key, data) {
  return new Promise((resolve, reject) => {
    const s3 = new AWS.S3()
    const params = {
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(data, 'base64'),
      ContentType: 'application/pdf',
    }

    s3.upload(params, (err, resp) => {
      if (err) return reject(err)
      return resolve(resp)
    })
  })
}

module.exports = putObjectToS3
