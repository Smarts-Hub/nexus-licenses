import { WebhookClient, EmbedBuilder } from "discord.js";
import Licenses from "../../schemas/Licenses.js";
import Products from "../../schemas/Products.js";
import config from "../../config.js";
import { encrypt } from "../../utils.js";
import { generateLicense } from "../../config.js"
class LicenseManager {
  constructor() {
    this.webhookClient = new WebhookClient({ url: config.webhookUrl });
  }

  // Método para crear una nueva licencia
  async createLicense({ productName, maxLogins, maxIps, expires, ownerName }) {
    if (!productName) {
      throw new Error("Product name is required");
    }

    // Verificar si el producto existe
    const product = await Products.findOne({ name: productName });
    if (!product) {
      await this.sendErrorNotification(`Product not found: ${productName}`);
      throw new Error(`Product not found: ${productName}`);
    }

    // Crear el nuevo ID de licencia y encriptarlo
    const licenseKey = generateLicense();
    const encryptedKey = await encrypt(licenseKey);

    // Guardar la licencia en la base de datos
    const newLicense = new Licenses({
      key: encryptedKey,
      productId: product._id,
      maxLogins,
      maxIps,
      expires,
      currentLogins: 0,
      blacklisted: false,
      ips: [],
      ownerName,
      createdBy: "API"
    });
    await newLicense.save();

    // Enviar notificación de creación
    await this.sendLicenseCreatedNotification(newLicense, productName, licenseKey);

    return {
      key: licenseKey,
      productName: productName,
      expires: newLicense.expires,
      ownerName: newLicense.ownerName,
      createdBy: newLicense.createdBy,
      blacklisted: newLicense.blacklisted,
      maxLogins: newLicense.maxLogins,
      maxIPs: newLicense.maxIPs,
      currentLogins: newLicense.currentLogins,
      ips: newLicense.ips,
      ownerName: newLicense.ownerName,
      createdBy: newLicense.createdBy,
    };
  }

  // Notificación de creación de licencia
  async sendLicenseCreatedNotification(license, productName, key) {
    const embed = new EmbedBuilder()
      .setTitle(`\`🟢\` New License Created`)
      .setColor("00FF00")
      .addFields(
        { name: "License Key", value: key, inline: true },
        { name: "Product", value: productName, inline: true },
        { name: "Expires", value: license.expires ? license.expires.toISOString() : "No expiration", inline: true },
      )
      .setTimestamp();

    await this.webhookClient.send({ embeds: [embed] });
  }

  // Notificación de error
  async sendErrorNotification(message) {
    const embed = new EmbedBuilder()
      .setTitle(`\`🔴\` License Creation Error`)
      .setColor("FF0000")
      .setDescription(message)
      .setTimestamp();

    await this.webhookClient.send({ embeds: [embed] });
  }
}

export default LicenseManager;
