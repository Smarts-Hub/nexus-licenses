import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import config from '../../config.js';
import { encrypt, decrypt } from "../../utils.js"; // Asegúrate de que `encrypt` esté bien definido
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../../config.js');

export default {
    data: new SlashCommandBuilder()
        .setName('token')
        .setDescription('Manage interaction api tokens')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a new interaction api token')),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(config.adminRoleId)) {
            const noPermissionEmbed = new EmbedBuilder()
                .setTitle('No permission')
                .setColor('D83F31')
                .setDescription('You don\'t have the permission to manage tokens.');
        
            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }

        const subCommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true }); // Defer reply for all subcommands

        if (subCommand === 'create') {
            // Verifica si ya existe interactionApiKey
            if (config.interactionApiKey && config.interactionApiKey !== 'default') {
                const existingTokenEmbed = new EmbedBuilder()
                    .setTitle('Existing Interaction API Key')
                    .setColor('D83F31')
                    .setDescription(`There is an existing token: \`${await decrypt(config.interactionApiKey)}\``);
                
                return interaction.editReply({ embeds: [existingTokenEmbed], ephemeral: true });
            }

            // Generar un nuevo token
            const newToken = crypto.randomBytes(59).toString('base64');
            const encryptedToken = encrypt(newToken);

            // Actualizar solo el campo interactionApiKey
            config.interactionApiKey = encryptedToken; // Guardar el token encriptado

            // Función para actualizar el campo en el archivo config.js
            const updateConfigFile = (key, value) => {
                const newContent = fs.readFileSync(configPath, 'utf8').replace(
                    /interactionApiKey:\s*".*?"/,
                    `interactionApiKey: "${value}"`
                );
                fs.writeFileSync(configPath, newContent, 'utf8');
            };

            updateConfigFile('interactionApiKey', encryptedToken);

            const successEmbed = new EmbedBuilder()
                .setTitle('Token Created')
                .setColor('32D83F')
                .setDescription('The new token has been created and saved in config.js.\n`'+ newToken + '`');

            return interaction.editReply({ embeds: [successEmbed], ephemeral: true });
        }
    },
};
