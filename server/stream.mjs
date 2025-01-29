import * as Minio from "minio";
import readline from "readline";
import express from 'express';
import cors from 'cors';

// Retrieve environment variables
const accessKey  = process.env.MY_BUCKET_ACCESS_KEY_ID;
const secretKey  = process.env.MY_BUCKET_SECRET_ACCESS_KEY;
const endPoint   = process.env.MY_BUCKET_ENDPOINT_URL || '';
const bucketName = process.env.MY_BUCKET_NAME || '';

// Configure the MinIO client for OVH Object Storage
const minioClient = new Minio.Client({
  endPoint,
  port: 443,
  useSSL: true,
  accessKey,
  secretKey,
});

const app = express();
const port = 3000;

// Use the CORS middleware
app.use(cors());

app.get('/', async (req, res) => {
    const key = req.query.file;

    if (!key) {
        res.status(404).send("File not provided");
        return;
    }

    try {
        const time = new Date().getTime();
        // Get the object stream from the bucket
        const objectStream = await minioClient.getObject(bucketName, key);

        // Use readline to process the stream line by line
        const rl = readline.createInterface({
            input: objectStream,
            crlfDelay: Infinity, // Handle both \n and \r\n line endings
        });

        for await (const line of rl) {
            // Append each line to the response text
            res.write(`${line}\n`);
        }

        res.write("\nStreamed in " + (new Date().getTime() - time) + "ms");
        res.end();

    } catch (error) {
        console.error("Error streaming file:", error);
        res.status(500).send("Error streaming file");
    }
});

  
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});