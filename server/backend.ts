import { GenezioDeploy } from "@genezio/types";
import * as Minio from "minio";
import { randomBytes } from 'crypto';

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

@GenezioDeploy()
export class BackendService {
  constructor() {}

  private generateRandomFile() {
    // Generate a random file name
    const randomFileName = `random_file_${randomBytes(8).toString('hex')}.txt`;
    
    const targetSize = 1024 * 1024; // 1MB
    const characters = 'A BCDME FGH I JKLMNOPQRS TUVWXYZ a bcdef gh i jklmn opqrstu vwxyz 0 123 4567 89';
    let currentSize = 0;
    const lines = [];

    while (currentSize < targetSize) {
        const lineLength = Math.floor(Math.random() * 61) + 40;
        const line = Array.from({ length: lineLength }, () =>
            characters.charAt(Math.floor(Math.random() * characters.length))
        ).join('');
        lines.push(line);
        currentSize += Buffer.byteLength(line + '\n', 'utf8');
    }

    return [randomFileName, lines.join('\n')];
  }

  async list(): Promise<string[]> {
    const objects = minioClient.listObjects(bucketName, '', true);
    const result = [];
    for await (const obj of objects) {
      result.push(obj.name);
    }
    return result;
  }

  async create(): Promise<string> {
    const [fileName, fileContent] = this.generateRandomFile();
    const now = new Date().getTime();
    await minioClient.putObject(bucketName, fileName, fileContent);
    return "Created in " + ((new Date().getTime()) - now) + "ms";
  }

  async delete(fName: string): Promise<string> {
    const now = new Date().getTime();
    await minioClient.removeObject(bucketName, fName);
    return "Deleted in " + ((new Date().getTime()) - now) + "ms";
  }
}
