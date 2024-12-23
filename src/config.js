const config = {
  licenseKey: "WSJOX-32YCG-NRQG4-IIC18-G97OH", // Your license key
  token: "MTMxMTAwMjk0MzQ0MDU1MTk3Nw.GWshS3.lOwiv13rwJgZAaT_P1a9syHhsmJSYNcIs7OVEk", // Your bot's token
  botId: "1311002943440551977", // Your bot's id
  guildId: "1067924392551665766", // Your guild's id
  adminRoleId: "1154752038534651934", // The role id for administrators on your guild
  webhookUrl: "https://discord.com/api/webhooks/1256214916281663489/MzA3qlP1koda-LjvGjsZJaiEF9iw1dgYskGtvfE-aI8gqHgciJG7TokzImV0B1-641pj",

  webServerConfig: {
    port: 3110,
    log: false,
    locationLog: true // Get the real location of a request
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
  interactionApiKey: "87b721b19262a6a7c1e90182b283f018:bd8182bb6855c844321b4fe89afb34bfa003c872b3e63d1a915583cad648eeb365033eb14677ebfae76499c7698bc905f25201b965bdda327fb100837661ac82174e72eadef1e85a131d069cdb67cdf09195505d3b0ef60c7cbaaa8f681ad562",
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
