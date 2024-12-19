import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import Products from "../../schemas/Products.js";
import Licenses from "../../schemas/Licenses.js";
import { generateLicense, decrypt, encrypt, interpolate } from "../../utils.js";
import config from "../../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mylicenses")
    .setDescription("Manage licenses")
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("Lists your licenses")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rotate")
        .setDescription("Rotates a license")
        .addStringOption((option) =>
          option
            .setName("license")
            .setDescription("The current license to rotate")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const subCommand = interaction.options.getSubcommand();

    if (subCommand === "list") {
      try {
        const userLicenses = await Licenses.find({
          ownerId: interaction.user.id,
        });

        if (userLicenses.length === 0) {
          const noLicensesEmbed = new EmbedBuilder()
            .setTitle("No licenses")
            .setColor("D83F31")
            .setDescription(interpolate(config.messages.user.noLicenses, {}));
          return interaction.editReply({
            embeds: [noLicensesEmbed],
          });
        }

        let licensesDescriptions = '';
        for (const license of userLicenses) {
          const product = await Products.findById(license.productId);
          const productName = product ? product.name : "Unknown product";
          const decryptedKey = await decrypt(license.key);
          const remainingLogins = license.maxLogins - license.currentLogins;
        
          licensesDescriptions += `> **\`${decryptedKey}\`**\n> Created at: **${new Date(
            license.createdAt
          ).toLocaleString()}**\n> Product: ${productName}\n> Remaining logins: ${remainingLogins}\n\n`;
        }

        const licensesEmbed = new EmbedBuilder()
          .setTitle("Your licenses")
          .setColor("005DFF")
          .setDescription(licensesDescriptions)
          .setTimestamp();

        return interaction.editReply({ embeds: [licensesEmbed] });
      } catch (error) {
        console.error("Error fetching user licenses:", error);
        const errorMessage = new EmbedBuilder()
          .setTitle("Error")
          .setColor("D83F31")
          .setDescription(
            interpolate(config.messages.user.errorFetchingLicenses, { error: { message: error.message } })
          );
        return interaction.editReply({ embeds: [errorMessage] });
      }
    } else if (subCommand === "rotate") {
      const licenseKey = interaction.options.getString("license");
      try {
        const encryptedLicenseKey = await encrypt(licenseKey);
        const license = await Licenses.findOne({ key: encryptedLicenseKey });
        if (!license) {
          const noLicenseEmbed = new EmbedBuilder()
            .setTitle("Unknown license")
            .setColor("D83F31")
            .setDescription(interpolate(config.messages.user.inexistentLicense, {}));
          return interaction.editReply({
            embeds: [noLicenseEmbed],
          });
        }

        if (license.ownerId !== interaction.user.id) {
          const noPermissionEmbed = new EmbedBuilder()
            .setTitle("No permission")
            .setColor("D83F31")
            .setDescription(
              interpolate(config.messages.user.rotationDenied, {})
            );
          return interaction.editReply({
            embeds: [noPermissionEmbed],
          });
        }

        const rotatedLicense = generateLicense();
        const encryptedRotatedLicense = await encrypt(rotatedLicense);

        await Licenses.updateOne(
          { key: encryptedLicenseKey },
          {
            $set: {
              key: encryptedRotatedLicense,
            },
          },
          { upsert: true }
        );

        const successEmbed = new EmbedBuilder()
          .setTitle("License rotated successfully!")
          .setColor("219C90")
          .addFields(
            { name: "New License Key", value: `\`${rotatedLicense}\``, inline: true },
            { name: "Product", value: license.productId, inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [successEmbed] });

      } catch (error) {
        console.error("Error rotating license:", error);
        const errorMessage = new EmbedBuilder()
          .setTitle("Error")
          .setColor("D83F31")
          .setDescription(
            interpolate(config.messages.user.errorRotating, { error: { message: error.message } })
          );
        return interaction.editReply({ embeds: [errorMessage] });
      }
    }
  },
};
