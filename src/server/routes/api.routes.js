import express from "express";
const router = express.Router();
import config from "../../config.js"
import { decrypt } from "../../utils.js"
import { checkLicense, validateLicense } from "../controllers/licenses.controller.js";
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

  res.json({ status: "ok", message: "Valid token"});
});


export default router;
