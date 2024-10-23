const config = {
  licenseKey: "", // Your license key
  token: "", // Your bot's token
  botId: "", // Your bot's id
  guildId: "", // Your guild's id
  adminRoleId: "", // The role id for administrators on your guild
  webhookUrl: "", // Admin login webhook

  webServerConfig: {
    port: 3110,
    apiSecret: ""
  },

  MongoDBUri: "mongodb://localhost:27017/licensing", // The MongoDB URI where data is saved. Recommended to use MongoDB Atlas!

  keys: {
    sections: 7,
    sectionsLength: 5,
  },

  cron: "0 0 * * *",

  messages: {
    user: {
      licenseCreated: "🔑 **License Information**\n> 🗝️ Key: `\${key}`\n> 🛠️ Product: `\${product}`\n> 🔄 Max Logins/day: **${maxLogins}**\n> 👤 Created by: **${createdBy}**\n\n→ **To rotate this license use /mylicenses rotate `${key}`**\n→ **To see all your licenses, use /mylicenses list**",
      noPermission: "🚫 You don't have the permission to manage licenses.",
      licenseDeleted: "❌ **License Information**\n> 🛠️ Product: \${product}\n> ⚠️ Reason: **${reason}**\n\nIf you believe this was a mistake, please contact support.",
      noLicenses: "🔍 You don't have any licenses.",
      errorFetchingLicenses: "⚠️ An error occurred while fetching your licenses.\n\n${error}",
      inexistentLicense: "❓ The license you provided does not exist.",
      rotationDenied: "⛔ You don't have permission to rotate this license. \nYou are not the owner.",
      licenseRotated: "🔄 Your license has been rotated to **${rotatedLicense}**.",
      errorRotating: "⚠️ An error occurred while rotating your license.\n\n${error}"
    }
  },
  emojis: {
    success: "✅",
    error: "❌",
    license: "🔑",
    login: "🔓",
    ip: "🌍",
  },
  interactionApiKey: "",

};

export default config;

export const generateLicense = () => {
  let groups = [];
  for (let i = 0; i < config.keys.sections; i++) {
    groups.push(
      Math.random()
        .toString(36)
        .substr(2, config.keys.sectionsLength)
        .toUpperCase()
    );
  }

  let license = groups.join("-");
  return license;
}
