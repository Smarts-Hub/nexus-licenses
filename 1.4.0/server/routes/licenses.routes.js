import express from "express";
const router = express.Router();

import { checkLicense, validateLicense } from "../controllers/licenses.controller.js";
router.get("/", async (req, res) => {
  res.json({
    status: "ok",
    message: "Licenses API is running",
    data: req.headers,
  });
});

router.get("/check", async (req, res) => {
  await checkLicense(req, res);
});

router.get("/validate", async (req, res) => {
  await validateLicense(req, res);
})

router.get("/getowner", async (req, res) => {
  await getOwner(req, res);
})

export default router;
