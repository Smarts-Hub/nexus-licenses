import { SlashCommandBuilder, EmbedBuilder, WebhookClient } from "discord.js";
import config from "../../config.js";
import Products from "../../schemas/Products.js";
import Licenses from "../../schemas/Licenses.js";
import { generateLicense, encrypt, interpolate } from "../../utils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("licenses")
    .setDescription("Manage licenses")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Creates a new license")
        .addStringOption((option) =>
          option
            .setName("product")
            .setDescription("The product to license")
            .setRequired(true)
        )
        .addUserOption((option) =>
          option
            .setName("customer")
            .setDescription("The owner of the license")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("max-logins")
            .setDescription("The maximum number of daily logins")
            .setRequired(false)
        )
        .addNumberOption((option) =>
          option
            .setName("max-ips")
            .setDescription("The maximum number of IPs")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("validity-days")
            .setDescription("The amount of days the license is valid")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Deletes a license")
        .addUserOption((option) =>
          option
            .setName("owner")
            .setDescription("The license owner")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("product")
            .setDescription("The product to remove")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for deleting the license")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) => 
      subcommand.setName("blacklist")
      .setDescription("Blacklists a license")
    .addStringOption((option) => 
    option.setName("license")
      .setDescription("The license to blacklist")
      .setRequired(true))
    .addStringOption((option) => option
      .setName("reason")
      .setDescription("The reason for blacklisting the license")
      .setRequired(false))  
    )
    .addSubcommand((subcommand) => 
      subcommand.setName("unblacklist")
      .setDescription("Removes a license from blacklist")
    .addStringOption((option) => 
    option.setName("license")
      .setDescription("The license to remove")
      .setRequired(true))
    ),

  async execute(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const webhookClient = new WebhookClient({ url: config.webhookUrl });

    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      const noPermissionEmbed = new EmbedBuilder()
        .setTitle(`${config.emojis.error} Access Denied`)
        .setColor("FF0000")
        .setDescription("You don't have the required permissions to manage licenses.")
        .setFooter({ text: "Contact an admin for assistance.", iconURL: config.footerIconUrl });

      return interaction.reply({
        embeds: [noPermissionEmbed],
        ephemeral: true,
      });
    }

    // Defer the reply before starting any long-running process
    await interaction.deferReply({ ephemeral: true });

    if (subCommand === "create") {
      try {
        const unencrypted = generateLicense();
        const key = await encrypt(unencrypted);

        const customer = interaction.options.getUser("customer");
        const productName = interaction.options.getString("product");
        const maxLogins = interaction.options.getNumber("max-logins") || -1;
        const maxIPs = interaction.options.getNumber("max-ips") || -1;
        const validityDays = interaction.options.getString("validity-days") || -1;
        const expirationDate = validityDays > 0 ? generateFutureDate(validityDays) : null;

        const product = await Products.findOne({ name: productName });
        if (!product) {
          return interaction.editReply({
            embeds: [new EmbedBuilder().setTitle("Error").setColor("FF0000").setDescription("Product not found.")],
            ephemeral: true,
          });
        }

        const existingLicense = await Licenses.findOne({ ownerId: customer.id, productId: product._id });
        if (existingLicense) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("License Already Exists")
                .setColor("FF9900")
                .setDescription(`The user already owns a license for \`${productName}\`.`)
                .setFooter({ text: "Use /licenses delete to remove the license." }),
            ],
            ephemeral: true,
          });
        }

        const newLicense = new Licenses({
          key,
          ownerId: customer.id,
          ownerName: customer.username,
          productId: product._id,
          createdBy: interaction.user.id,
          maxLogins,
          maxIps: maxIPs,
          expires: expirationDate,
          createdAt: Date.now(),
        });
        await newLicense.save();

        const successEmbed = new EmbedBuilder()
          .setTitle(`${config.emojis.success} License Created Successfully!`)
          .setColor("00FF00")
          .setDescription(`${config.emojis.license} **License Key:** \`${unencrypted}\`\n**Product:** ${productName}`)
          .addFields(
            { name: `${config.emojis.login} Max Logins`, value: `${maxLogins}`, inline: true },
            { name: `${config.emojis.ip} Max IPs`, value: `${maxIPs}`, inline: true },
            { name: "Created by", value: `<@${interaction.user.id}>`, inline: true },
            { name: "Expires", value: expirationDate ? expirationDate.toLocaleString() : "Never", inline: true },
          )
          .setFooter({ text: "Generated at", iconURL: config.footerIconUrl });

        const userEmbed = new EmbedBuilder()
          .setTitle(`${config.emojis.license} Your License is Ready!`)
          .setColor("00FF00")
          .setDescription(
            interpolate(config.messages.user.licenseCreated, {
              key: unencrypted,
              product: productName,
              maxLogins,
              createdBy: interaction.user.username,
            })
          )
          .setFooter({ text: "Thank you for your purchase!" });

        await customer.send({ embeds: [userEmbed] });
        webhookClient.send({ embeds: [successEmbed] });

        return interaction.editReply({ embeds: [successEmbed], ephemeral: true });
      } catch (error) {
        console.error("Error creating license:", error);
        return interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("Error").setColor("FF0000").setDescription(`An error occurred: ${error}`)],
          ephemeral: true,
        });
      }

    } else if (subCommand === "delete") {
      try {
        const owner = interaction.options.getUser("owner");
        const productName = interaction.options.getString("product");
        const reason = interaction.options.getString("reason") || "No reason provided";

        const product = await Products.findOne({ name: productName });
        if (!product) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`${config.emojis.error} Product Not Found`)
                .setColor("FF0000")
                .setDescription(`The product **${productName}** does not exist.`)
                .setFooter({ text: "Please double-check the product name.", iconURL: config.footerIconUrl })
            ],
            ephemeral: true,
          });
        }

        const licenseToDelete = await Licenses.findOne({ ownerId: owner.id, productId: product._id });
        if (!licenseToDelete) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`${config.emojis.error} License Not Found`)
                .setColor("FF0000")
                .setDescription(`No license found for **${owner.username}** on **${productName}**.`)
                .setFooter({ text: "Ensure the user has an active license for the specified product." })
            ],
            ephemeral: true,
          });
        }

        await Licenses.deleteOne({ _id: licenseToDelete._id });

        const successEmbed = new EmbedBuilder()
          .setTitle(`${config.emojis.success} License Deleted Successfully`)
          .setColor("00FF00")
          .setDescription(
            `${config.emojis.license} License for **${productName}** belonging to **${owner.username}** has been deleted.\n\n**Reason:** ${reason}`
          )
          .setFooter({ text: `Deleted by ${interaction.user.tag}`, iconURL: config.footerIconUrl });

        const webhookEmbed = new EmbedBuilder()
          .setTitle(`${config.emojis.error} License Deleted`)
          .setColor("FF0000")
          .setDescription(
            `${config.emojis.license} License for **${productName}** owned by **${owner.username}** was deleted by **<@${interaction.user.id}>**.\n\n**Reason:** ${reason}`
          )
          .setFooter({ text: `Deleted on ${new Date().toLocaleString()}` });

        const userEmbed = new EmbedBuilder()
          .setTitle(`${config.emojis.error} License Deleted`)
          .setColor("FF0000")
          .setDescription(interpolate(config.messages.user.licenseDeleted, {
            product: productName,
            reason: reason,
          }));

        await owner.send({ embeds: [userEmbed] });
        webhookClient.send({ embeds: [webhookEmbed] });

        return interaction.editReply({ embeds: [successEmbed], ephemeral: true });
      } catch (error) {
        console.error("Error deleting license:", error);
        return interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("Error").setColor("FF0000").setDescription(`An error occurred: ${error}`)],
          ephemeral: true,
        });
      }
    } else if (subCommand === "blacklist") {
      try {
        const license = interaction.options.getString("license");
        const reason = interaction.options.getString("reason") || "No reason provided";

        const encrypted = encrypt(license);
        const licenseToBlacklist = await Licenses.findOne({ key: encrypted });

        if (!licenseToBlacklist) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`${config.emojis.error} License Not Found`)
                .setColor("FF0000")
                .setDescription(`No license found`)
                .setFooter({ text: "This license may be expired or deleted" })
            ],
            ephemeral: true,
          });
        }

        licenseToBlacklist.blacklisted = true;
        await licenseToBlacklist.save();

        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${config.emojis.success} License blacklisted`)
              .setColor("00ff00")
              .setDescription(`That license has been blacklisted with reason: ${reason}.`)
              .setFooter({ text: "You can unblacklist it with /license unblacklist. No message to user sent" })
          ],
          ephemeral: true,
        });

      } catch (error) {
        console.error("Error blacklisting license:", error);
        return interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("Error").setColor("FF0000").setDescription(`An error occurred: ${error}`)],
          ephemeral: true,
        });
      
      }
    }else if (subCommand === "unblacklist") {
      try {
        const license = interaction.options.getString("license");

        const encrypted = encrypt(license);
        const licenseToBlacklist = await Licenses.findOne({ key: encrypted });

        if (!licenseToBlacklist || !licenseToBlacklist.blacklisted) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`${config.emojis.error} License Not Found`)
                .setColor("FF0000")
                .setDescription(`No license found`)
                .setFooter({ text: "This license may not be blacklisted" })
            ],
            ephemeral: true,
          });
        }

        licenseToBlacklist.blacklisted = true;
        await licenseToBlacklist.save();

        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${config.emojis.success} License removed from blacklist`)
              .setColor("00ff00")
              .setDescription(`That license has been reemoved from blacklist`)
              .setFooter({ text: "License unblacklisted" })
          ],
          ephemeral: true,
        });

      } catch (error) {
        console.error("Error removing license from blacklist license:", error);
        return interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("Error").setColor("FF0000").setDescription(`An error occurred: ${error}`)],
          ephemeral: true,
        });
      
      }
    }
  },
};

function generateFutureDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
