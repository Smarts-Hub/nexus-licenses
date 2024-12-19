import { REST, Routes, ActivityType } from 'discord.js';
import config from '../../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import chalk from 'chalk';
import Licenses from '../../schemas/Licenses.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let licensesCount = 0; // Variable inicial para el número de licencias

export default {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(chalk.green(`Bot logged in as ${client.user.tag}`));

        // Function to update presence dynamically
        const updatePresence = () => {
            client.user.setPresence({
                activities: [{ name: `${licensesCount} license${licensesCount === 1 ? '' : 's'}`, type: ActivityType.Watching }],
                status: 'viewing',
            });
        };

        // Update presence every 5 minutes
        updatePresence(); // Set initial presence
        setInterval(async () => {
            // Aquí podrías actualizar licensesCount desde una base de datos o cualquier fuente externa
            licensesCount = await Licenses.countDocuments();
            updatePresence();
        }, 10 * 1000); // 5 minutos en milisegundos

        const commands = [];
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const { default: command } = await import(pathToFileURL(filePath));
            commands.push(command.data.toJSON());
        }

        const rest = new REST().setToken(config.token);

        try {
            console.log('Started refreshing commands.');

            await rest.put(
                Routes.applicationCommands(config.botId),
                { body: commands },
            );

            console.log('Successfully reloaded commands.');
        } catch (error) {
            console.error(error);
        }
    },
};
