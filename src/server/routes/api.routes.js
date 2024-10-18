import express from "express";
const router = express.Router();
import config from "../../config.js"
import { decrypt } from "../../utils.js"

import Licenses from "../../schemas/Licenses.js"
import Products from "../../schemas/Products.js";

router.get("/", async (req, res) => {
  res.json({
    status: "ok",
    message: "Interaction API is running. Start by creating a new interaction api token with the command /token create",
    data: req.headers,
  });
});

router.get("/check", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Undefined token'} });
  }

  if (token !== await decrypt(config.interactionApiKey)) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Invalid token'} });
  }

  res.json({ status: "ok", message: "Valid token", data: { permissions: "allow_all", token: token, timestamp: Date.now() } });
});

router.post('/products/create', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Undefined token'} });
  }

  if (token !== await decrypt(config.interactionApiKey)) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Invalid token'} });
  }

  const product = req.body.name;
  const roleID = req.body.roleID;
  
  if(!product || !roleID) {
    return res.json({ status: "error", message: "Invalid request", data: { error: 'Missing required fields'} });
  }
  if(await Products.findOne({ name: product })) {
    return res.json({ status: "error", message: "Product already exists", data: { error: 'Product already exists'} });
  }

  const newProduct = new Products({ name: product, customerRoleId: roleID });
  newProduct.save();
  return res.json({ status: "success", message: "Product created", data: { product: newProduct, timestamp: Date.now() } });
  
})

router.get('/products/list', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Undefined token'} });
  }

  if (token !== await decrypt(config.interactionApiKey)) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Invalid token'} });
  }
  const allProducts = await Products.find();
  return res.json({ status: "success", message: "Products listed", data: { products: allProducts, timestamp: Date.now() } });
})

router.delete('/products/delete', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Undefined token'} });
  }

  if (token !== await decrypt(config.interactionApiKey)) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Invalid token'} });
  }
  const productId = req.body.product;

  if(!productId) {
    return res.json({ status: "error", message: "Invalid request", data: { error: 'Missing required field'} });
  }

  const productToDelete = await Products.findByIdAndDelete(productId);
  if(!productToDelete) {
    return res.json({ status: "error", message: "Product not found", data: { error: 'Product not found'} });
  }
  return res.json({ status: "success", message: "Product deleted", data: { product: productToDelete, timestamp: Date.now() } });
})

router.get('/licenses/list', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Undefined token'} });
  }

  if (token !== await decrypt(config.interactionApiKey)) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Invalid token'} });
  }
  const allLicenses = await Licenses.find();
  return res.json({ status: "success", message: "Licenses listed", alert: "Licenses are encrypted, to get unencrypted licenses, use /apiv1/licenses/list/decrypted or decrypt a license by using /apiv1/licenses/decrypt", data: { licenses: allLicenses, timestamp: Date.now() } });
})

router.get('/licenses/list/decrypted', async (req, res) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Undefined token'} });
  }

  if (token !== await decrypt(config.interactionApiKey)) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Invalid token'} });
  }

  try {
    const allLicenses = await Licenses.find();
    let decryptedLicenses = [];

    allLicenses.forEach(license => {
      // Decrypt the license key
      const decryptedKey = decrypt(license.key);
      
      // Create a new object with the decrypted key
      const licenseData = {
        ...license.toObject(), // Convert mongoose document to plain object
        key: decryptedKey // Replace the key with the decrypted version
      };

      decryptedLicenses.push(licenseData);
    });

    return res.json({ 
      status: "success", 
      message: "Success", 
      data: { 
        licenses: decryptedLicenses, 
        timestamp: Date.now() 
      }
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "error", message: "Failed to retrieve licenses", data: { error: error.message } });
  }
});

router.get('/licenses/decrypt', async (req, res) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Undefined token'} });
  }

  if (token !== await decrypt(config.interactionApiKey)) {
    return res.json({ status: "error", message: "Invalid token", data: { error: 'Invalid token'} });
  }

  const licenseKey = req.query.key;

  if (!licenseKey) {
    return res.json({ status: "error", message: "Invalid request", data: { error: 'Missing required field' } });
  }
  const decrypted = await decrypt(licenseKey);

  return res.json({ status: "success", message: "Decrypted license key", data: { key: decrypted, timestamp: Date.now() } });
})

export default router;
