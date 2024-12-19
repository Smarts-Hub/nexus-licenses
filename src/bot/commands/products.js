import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from '../../config.js';
import Products from '../../schemas/Products.js';
import Licenses from '../../schemas/Licenses.js';

export default {
    data: new SlashCommandBuilder()
        .setName('product')
        .setDescription('Create/delete/update products')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a new product')
                .addStringOption(option => option.setName('name').setDescription('The name of the product').setRequired(true))
                .addRoleOption(option => option.setName('customer-role').setDescription('The role given to customers when they claim a license').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes a product')
                .addStringOption(option => option.setName('name').setDescription('The name of the product to delete').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Updates a product')
                .addStringOption(option => option.setName('name').setDescription('The name of the product to update').setRequired(true))
                .addStringOption(option => option.setName('new-name').setDescription('New name of the product (if is empty, the name will not be updated)'))
                .addRoleOption(option => option.setName('new-customer-role').setDescription('New customer role of the product (if is empty, the customer role will not be updated)')))
        .addSubcommand(subcommand =>
            subcommand
               .setName('list')
               .setDescription('Lists all products')),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(config.adminRoleId)) {
            const noPermissionEmbed = new EmbedBuilder()
                .setTitle('No permission')
                .setColor('D83F31')
                .setDescription('You don\'t have the permission to manage products.');
        
            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }

        const subCommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true }); // Defer reply for all subcommands

        if (subCommand === 'create') {
            const name = interaction.options.getString('name');
            const customerRoleId = interaction.options.getRole('customer-role').id;

            if (!(await Products.findOne({ name }))) {
                try {
                    const product = new Products({ name, customerRoleId });
                    await product.save();
    
                    const successEmbed = new EmbedBuilder()
                        .setTitle(`Product ${name} created successfully!`)
                        .setColor('219C90')
                        .setDescription(`
                            **Product information:**
                            > Name: ${name}
                            > Customer role: <@&${customerRoleId}>
                            > ID: ${product._id}`);
                    return interaction.editReply({ embeds: [successEmbed], ephemeral: false });
                } catch (error) {
                    console.error(error);
                    const errorMessage = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('D83F31')
                        .setDescription(`Error creating a product.\`\`\`${error.message}\`\`\``);
                    return interaction.editReply({ embeds: [errorMessage], ephemeral: true });
                }
            } else {
                const errorMessage = new EmbedBuilder()
                    .setTitle('Product already exists')
                    .setColor('D83F31')
                    .setDescription('Product with that name already exists.');
                return interaction.editReply({ embeds: [errorMessage], ephemeral: true });
            }

        } else if (subCommand === 'delete') {
            const name = interaction.options.getString('name');

            const confirmEmbed = new EmbedBuilder()
                .setTitle('Confirm Deletion')
                .setColor('EE9322')
                .setDescription(`Are you sure you want to delete the product **${name}**?`);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm-delete')
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel-delete')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

            const filter = i => ['confirm-delete', 'cancel-delete'].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async i => {
                if (i.customId === 'confirm-delete') {
                    try {
                        await Products.findOneAndDelete({ name });
                        const successEmbed = new EmbedBuilder()
                            .setTitle(`Product ${name} deleted successfully!`)
                            .setColor('219C90');
                        await i.update({ embeds: [successEmbed], components: [], ephemeral: true });
                    } catch (error) {
                        console.error(error);
                        const errorMessage = new EmbedBuilder()
                            .setTitle('Error')
                            .setColor('D83F31')
                            .setDescription(`An error occurred while deleting the product.\`\`\`${error.message}\`\`\``);
                        await i.update({ embeds: [errorMessage], components: [], ephemeral: true });
                    }
                } else if (i.customId === 'cancel-delete') {
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle('Deletion Cancelled')
                        .setColor('E9B824')
                        .setDescription(`The deletion of the product **${name}** has been cancelled.`);
                    await i.update({ embeds: [cancelEmbed], components: [], ephemeral: true });
                }
            });

        } else if (subCommand === 'update') {
            const name = interaction.options.getString('name');
            const newName = interaction.options.getString('new-name') ?? name;
            const newCustomerRole = interaction.options.getRole('new-customer-role');

            try {
                const updateData = {};
                if (newName !== name) updateData.name = newName;
                if (newCustomerRole) {
                    updateData.customerRoleId = newCustomerRole.id;
                } else {
                    const existingProduct = await Products.findOne({ name });
                    if (existingProduct) {
                        updateData.customerRoleId = existingProduct.customerRoleId;
                    } else {
                        throw new Error(`Product \`${name}\` not found.`);
                    }
                }

                const updatedProduct = await Products.findOneAndUpdate({ name }, updateData);
                const successEmbed = new EmbedBuilder()
                    .setTitle(`Product ${name} updated successfully!`)
                    .setColor('219C90')
                    .setDescription(`
                        **Updated Product Information:**
                        > Name: ${newName}
                        > Customer role: <@&${updateData.customerRoleId}>
                        > ID: \`${updatedProduct._id}\`
                    `);
                return interaction.editReply({ embeds: [successEmbed], ephemeral: true });
            } catch (error) {
                console.error(error);
                const errorMessage = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('D83F31')
                    .setDescription(`An error occurred while updating the product.\`\`\`${error.message}\`\`\``);
                return interaction.editReply({ embeds: [errorMessage], ephemeral: true });
            }

        } else if (subCommand === 'list') {
            try {
                        // Fetch all products from the database
                const allProducts = await Products.find();

                const pageSize = 1; // Items per page (one product per page)
                let currentPage = 1;
                const totalPages = Math.ceil(allProducts.length / pageSize);


                // Function to generate the embed for the current page
                const generateEmbed = (page) => {
                  const product = allProducts[page - 1];
                  const licenses = Licenses.find({ productId: product._id });
                  const embed = new EmbedBuilder()
                    .setTitle('Product List')
                    .setColor('ffb4b4')
                    .setTimestamp();
                
                  embed.addFields(
                    { name: 'Name', value: product.name },
                    { name: 'Customer role', value: `<@&${product.customerRoleId}> \`${product.customerRoleId}\`` },
                    { name: 'ID', value: `\`${product._id}\`` },
                    { name: 'Created At', value: product.createdAt.toLocaleString() },
                    { name: 'Total licenses', value: `\`${licenses.length || 0}\`` },
                  );
              
                  return embed;
                };
            
                // Create pagination buttons
                const prevButton = new ButtonBuilder()
                  .setCustomId('prev-page')
                  .setLabel('Previous')
                  .setStyle('Primary')
                  .setDisabled(currentPage === 1);
            
                const nextButton = new ButtonBuilder()
                  .setCustomId('next-page')
                  .setLabel('Next')
                  .setStyle('Primary')
                  .setDisabled(currentPage === totalPages);
            
                const actionRow = new ActionRowBuilder().addComponents(prevButton, nextButton);
            
                // Send the initial embed with buttons
                const embed = generateEmbed(currentPage);
                const message = await interaction.editReply({ embeds: [embed], components: [actionRow], fetchReply: true });
            
                // Handle button interactions
                const filter = (i) => i.user.id === interaction.user.id;
                const collector = message.createMessageComponentCollector({ filter, time: 60000 });
            
                collector.on('collect', async (buttonInteraction) => {
                  if (buttonInteraction.customId === 'prev-page' && currentPage > 1) {
                    currentPage--;
                  } else if (buttonInteraction.customId === 'next-page' && currentPage < totalPages) {
                    currentPage++;
                  }
              
                  // Update the embed and buttons
                  const updatedEmbed = generateEmbed(currentPage);
                  prevButton.setDisabled(currentPage === 1);
                  nextButton.setDisabled(currentPage === totalPages);
              
                  const updatedActionRow = new ActionRowBuilder().addComponents(prevButton, nextButton);
              
                  await buttonInteraction.update({ embeds: [updatedEmbed], components: [updatedActionRow] });
                });
            } catch (error) {
                console.error(error);
                const errorMessage = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('D83F31')
                    .setDescription(`An error occurred while fetching the products.\`\`\`${error.message}\`\`\``);
                return interaction.editReply({ embeds: [errorMessage], ephemeral: true });
            }
        }
    },
};
