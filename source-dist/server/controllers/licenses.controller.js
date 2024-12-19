import { WebhookClient, EmbedBuilder } from "discord.js";
import Licenses from "../../schemas/Licenses.js";
import Products from "../../schemas/Products.js";
import config from "../../config.js";
import { encrypt } from "../../utils.js";

// Función para verificar la licencia
export const checkLicense = async (req, res) => {
  const encryptedKey = req.query.key ?? "";
  const productName = req.query.pn ?? "";
  console.log(`Checking license for key: ${encryptedKey}, product: ${productName}`);

  if (!encryptedKey || !productName) {
    return res.status(400).json({
      timestamp: new Date(),
      status: 400,
      message: "Missing required parameters",
      key: encryptedKey,
      productName,
    });
  }

  try {
    const key = await encrypt(encryptedKey);
    const KeyData = await Licenses.findOne({ key });
    const ProductData = await Products.findOne({ name: productName });
    const webhookClient = new WebhookClient({ url: config.webhookUrl });

    if (!KeyData || !ProductData) {
      const errorEmbed = new EmbedBuilder()
        .setTitle(`\`🔴\` License/Product Error`)
        .setColor("FF0000")
        .setDescription(`Failed to find license or product. Key: \`${encryptedKey}\`, Product: \`${productName}\``)
        .setTimestamp();
      webhookClient.send({ embeds: [errorEmbed] });

      return res.status(400).json({
        timestamp: new Date(),
        status: 400,
        message: "Unknown license or product",
        key: encryptedKey,
        productName,
      });
    }

    // Verificar si la licencia está en blacklist
    if (KeyData.blacklisted) {
      const errorEmbed = new EmbedBuilder()
        .setTitle(`\`🔴\` License Blacklisted`)
        .setColor("FF0000")
        .setDescription(`The license is blacklisted. Key: \`${encryptedKey}\``)
        .setTimestamp();
      webhookClient.send({ embeds: [errorEmbed] });

      return res.status(400).json({
        timestamp: new Date(),
        status: 400,
        message: "This license is blacklisted",
      });
    }

    // Verificar la expiración
    if (KeyData.expires && new Date() > KeyData.expires) {
      const errorEmbed = new EmbedBuilder()
        .setTitle(`\`🔴\` License Expired`)
        .setColor("FF0000")
        .setDescription(`The license has expired. Key: \`${encryptedKey}\``)
        .setTimestamp();
      webhookClient.send({ embeds: [errorEmbed] });

      return res.status(400).json({
        timestamp: new Date(),
        status: 400,
        message: "This license has expired",
      });
    }

    // Verificar maxLogins
    if (KeyData.maxLogins !== -1 && KeyData.maxLogins <= KeyData.currentLogins) {
      const errorEmbed = new EmbedBuilder()
        .setTitle(`\`🔴\` Maximum Logins Reached`)
        .setColor("FF0000")
        .setDescription(`Max logins reached for key: \`${encryptedKey}\`, Product: \`${productName}\``)
        .setTimestamp();
      webhookClient.send({ embeds: [errorEmbed] });

      return res.status(400).json({
        timestamp: new Date(),
        status: 400,
        message: "This license has reached the maximum number of logins in one day",
        currentLogins: KeyData.currentLogins,
        maxLogins: KeyData.maxLogins,
      });
    }

    // Verificar maxIps
    if (KeyData.maxIps !== -1 && KeyData.ips.length >= KeyData.maxIps) {
      const errorEmbed = new EmbedBuilder()
        .setTitle(`\`🔴\` Maximum IPs Reached`)
        .setColor("FF0000")
        .setDescription(`Max IPs reached for key: \`${encryptedKey}\`, Product: \`${productName}\``)
        .setTimestamp();
      webhookClient.send({ embeds: [errorEmbed] });

      return res.status(400).json({
        timestamp: new Date(),
        status: 400,
        message: "This license has reached the maximum number of IPs",
      });
    }

    if (KeyData.ips.includes(req.ip)) {
      await Licenses.updateOne(
        { key },
        {
          $set: {
            currentLogins: KeyData.currentLogins + 1,
            latestIp: req.ip,
          },
        },
        { upsert: true }
      );
    } else {
      await Licenses.updateOne(
        { key },
        {
          $set: {
            currentLogins: KeyData.currentLogins + 1,
            latestIp: req.ip,
            ips: [...KeyData.ips, req.ip],
          },
        },
        { upsert: true }
      );
    }

    // Si pasa todas las validaciones, actualizamos la licencia
    await Licenses.updateOne(
      { key },
      {
        $set: {
          currentLogins: KeyData.currentLogins + 1,
          latestIp: req.ip,
          ips: [...KeyData.ips, req.ip],
        },
      },
      { upsert: true }
    );

    const NewKeyData = await Licenses.findOne({ key });
const clientIp = req.ip.includes('::ffff:') ? req.ip.split('::ffff:')[1] : req.ip;

const fields = [
  { name: "Current Logins", value: `${NewKeyData.currentLogins}` },
  { 
    name: "Remaining Logins", 
    value: NewKeyData.maxLogins !== -1 
      ? `${NewKeyData.maxLogins - NewKeyData.currentLogins}` 
      : "Unlimited" 
  },
  { name: "License Owner", value: `<@${NewKeyData.ownerId}>` },
  { name: "License Owner ID", value: `${NewKeyData.ownerId}` },
  { name: "IP", value: `\`IP: ${clientIp}\`` },
  { name: "Product Name", value: productName },
];
    const successEmbed = new EmbedBuilder()
      .setTitle(`\`🟢\` New Login`)
      .setColor("00FA00")
      .setDescription(`
        **License Information:**
        \`\`\`${encryptedKey}\`\`\`
      `)
      .addFields(fields)
      .setTimestamp();

    webhookClient.send({ embeds: [successEmbed] });

    return res.status(200).json({
      timestamp: new Date(),
      status: 200,
      message: "License is valid and product enabled",
    });
  } catch (error) {
    console.error("Error checking license:", error);
    return res.status(500).json({
      timestamp: new Date(),
      status: 500,
      message: "Internal server error",
    });
  }
};

// Función para validar la licencia
export const validateLicense = async (req, res) => {
  const encryptedKey = req.query.key ?? "";
  const productName = req.query.pn ?? "";

  if (!encryptedKey || !productName) {
    return res.status(400).json({
      timestamp: new Date(),
      status: 400,
      message: "Missing required parameters",
      key: encryptedKey,
      productName,
    });
  }

  try {
    const key = await encrypt(encryptedKey);
    const keyData = await Licenses.findOne({ key });
    const webhookClient = new WebhookClient({ url: config.webhookUrl });

    if (keyData && keyData.productName === productName) {
      const successEmbed = new EmbedBuilder()
        .setTitle(`\`🟢\` License Validated`)
        .setColor("00FA00")
        .setDescription(`License validated for product: \`${productName}\``)
        .setTimestamp();

      webhookClient.send({ embeds: [successEmbed] });

      return res.status(200).json({
        timestamp: new Date(),
        status: 200,
        message: "License is valid for this product",
      });
    } else {
      const errorEmbed = new EmbedBuilder()
        .setTitle(`\`🔴\` License/Product Error`)
        .setColor("FF0000")
        .setDescription(`Invalid license or product. Key: \`${encryptedKey}\`, Product: \`${productName}\``)
        .setTimestamp();

      webhookClient.send({ embeds: [errorEmbed] });

      return res.status(400).json({
        timestamp: new Date(),
        status: 400,
        message: "Invalid license or product",
      });
    }
  } catch (error) {
    console.error("Error validating license:", error);
    return res.status(500).json({
      timestamp: new Date(),
      status: 500,
      message: "Internal server error",
    });
  }
};

// Función para obtener el propietario de la licencia
export const getOwner = async (req, res) => {
  const decryptedKey = req.query.key ?? "";

  if (!decryptedKey) {
    return res.status(400).json({
      timestamp: new Date(),
      status: 400,
      message: "Missing key",
    });
  }

  try {
    const key = await encrypt(decryptedKey);
    const keyData = await Licenses.findOne({ key });
    const webhookClient = new WebhookClient({ url: config.webhookUrl });

    if (keyData) {
      const successEmbed = new EmbedBuilder()
        .setTitle(`\`🟢\` Owner Information Retrieved`)
        .setColor("00FA00")
        .setDescription(`Owner retrieved for key: \`${decryptedKey}\`, Owner: <@${keyData.ownerId}>`)
        .setTimestamp();

      webhookClient.send({ embeds: [successEmbed] });

      return res.status(200).json({
        timestamp: new Date(),
        status: 200,
        message: "Successfully retrieved owner information",
        ownerID: keyData.ownerId,
        ownerName: keyData.ownerName,
      });
    } else {
      const errorEmbed = new EmbedBuilder()
        .setTitle(`\`🔴\` License Not Found`)
        .setColor("FF0000")
        .setDescription(`License not found for key: \`${decryptedKey}\``)
        .setTimestamp();

      webhookClient.send({ embeds: [errorEmbed] });

      return res.status(400).json({
        timestamp: new Date(),
        status: 400,
        message: "License not found",
      });
    }
  } catch (error) {
    console.error("Error retrieving owner information:", error);
    return res.status(500).json({
      timestamp: new Date(),
      status: 500,
      message: "Internal server error",
    });
  }
};
