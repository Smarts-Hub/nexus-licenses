import { pathToFileURL } from "url";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from 'url';
import axios from 'axios';
import chalk from "chalk";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const algorithm = 'aes-256-cbc'; 

const encryptionFilePath = path.join(__dirname, './encryption_data.json');

function generateRandomBytes(size) {
  return crypto.randomBytes(size).toString('hex');
}

let iv;
let key;

export async function initializeEncryptionData() {
  try {
    if (fs.existsSync(encryptionFilePath)) {
      const data = JSON.parse(fs.readFileSync(encryptionFilePath, 'utf8'));
      iv = Buffer.from(data.IV, 'hex');
      key = Buffer.from(data.ENCRYPT_KEY, 'hex');

      console.log('Encryption data loaded:', data);
    } else {
      const encryptionData = {
        IV: generateRandomBytes(64),
        ENCRYPT_KEY: generateRandomBytes(512),
      };
      fs.writeFileSync(encryptionFilePath, JSON.stringify(encryptionData, null, 2), 'utf8');
      iv = Buffer.from(encryptionData.IV, 'hex');
      key = Buffer.from(encryptionData.ENCRYPT_KEY, 'hex');
      console.log('New encryption data created:', encryptionData);
    }
  } catch (error) {
    console.error('Error initializing encryption data:', error);
    throw error;
  }
}

export function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText) {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function interpolate(template, values) {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => values[key] || '');
}

export async function verifyLicense(licenseKey) {
  const licenseServerUrl = 'http://84.247.167.236:25572/licenses/check';


  const productName = 'Nexus Licensing system';
  try {
      // Make a GET request with the license key and product name as query parameters
      const response = await axios.get(licenseServerUrl, {
          params: {
              key: licenseKey,  // 'key' is the query parameter for the license key
              pn: productName   // 'pn' is the query parameter for the product name
          }
      });

      // Check if the response is valid (status code 200)
      if (response.data.status === 200) {
          console.log("License verified successfully:", response.data.message);

          
          return true;
          // You can now use the product based on the license details in response.data
      } else {
        console.log("License verification failed:", response.data.message);
        return false;
      }
  } catch (error) {
      // Handle any errors during the HTTP request
      console.error("Error during license verification:", error.response?.data || error.message);
      return false;
  }
}

export { generateLicense } from './config.js';
