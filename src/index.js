import chalk from "chalk";
import mongoose from "mongoose";
import cron from "node-cron";

import config from "./config.js";
import constants from "./lib.js";
import { initializeEncryptionData, verifyLicense } from "./utils.js";



console.log(chalk.green("Starting licensing system..."));
console.log(
  chalk.greenBright("Nexus Licenses by Jayox. Version " + constants.version)
);

if(!(await verifyLicense(config.licenseKey))) {
  console.log(chalk.red("Shutting down Nexus Licenses..."));
  process.exit(1);
}

// Initialize encryption data
await initializeEncryptionData();

import Licenses from "./schemas/Licenses.js";
import client from "./bot/bot.js";
import webserver from "./server/app.js";

// Launch the web server
console.log(("Launching web server..."));
await webserver();

// Connect to MongoDB database
console.log(("Connecting to database..."));
await mongoose.connect(config.MongoDBUri);
console.log(("Connected to database!"));

// Start the bot
console.log(("Starting bot..."));
await client.login(config.token);

cron.schedule(config.cron, async () => {
  console.log(("Starting cron jobs..."));
  await resetLogins();
  console.log(("Ended cron jobs!"));
});

const resetLogins = async () => {
  console.log(chalk.blue("Resetting logins..."));
  await Licenses.updateMany(
    {},
    {
      $set: {
        currentLogins: 0,
      },
    },
    { upsert: true }
  );
  console.log(chalk.blue("All logins have been reset!"));
};
