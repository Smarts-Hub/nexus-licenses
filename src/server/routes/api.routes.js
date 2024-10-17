import express from "express";
const router = express.Router();
import config from "../../config.js"
import { decrypt } from "../../utils.js"

import licenses from "../../schemas/Licenses.js"
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

  const newProduct = new Products({ product, customerRoleId: roleID });
  return res.json({ status: "success", message: "Product created", data: { product: newProduct, timestamp: Date.now() } });
})

router.get('/products/list', async (req, res) => {
  
})


export default router;
