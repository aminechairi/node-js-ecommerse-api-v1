const { S3Client } = require("@aws-sdk/client-s3");

const awsBucketRegion = process.env.AWS_BUCKET_REGION;
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: awsBucketRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
});

module.exports = s3Client;