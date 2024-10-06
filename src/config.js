const config = {
  licenseKey: "WSJOX-32YCG-NRQG4-IIC18-G97OH", // Your license key
  token: "MTI1NTk4MDQ0NDg5MDE2OTQ1NA.GL_Sty.Yw1wwkqeeXGpwNAoCb6-mtlFXz8Otc6JmMo_BI", // Your bot's token
  botId: "1255980444890169454", // Your bot's id
  guildId: "1067924392551665766", // Your guild's id
  adminRoleId: "1154752038534651934", // The role id for administrators on your guild
  webhookUrl: "https://discord.com/api/webhooks/1256214916281663489/MzA3qlP1koda-LjvGjsZJaiEF9iw1dgYskGtvfE-aI8gqHgciJG7TokzImV0B1-641pj", // Admin login webhook

  webServerConfig: {
    port: 3110,
    apiSecret: "9ppwz9303"
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
