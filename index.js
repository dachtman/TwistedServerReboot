require('dotenv').config();
const { readdirSync } = require('fs');
const { Client, Intents, Collection } = require('discord.js');
const { writeToLogFile } = require('./scripts/file.js');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});
client.commands = new Collection();
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
commandFiles.forEach((file) => {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
});

client.once('ready', () => {
	// writeToLogFile('NONE', `Logged in as ${client.user.tag}!`);
});

// TODO
// Ephermeral buttons for voting to restart the server
client.on('interactionCreate', (interaction) => {
	if (!interaction.isCommand() && !interaction.isSelectMenu()) return;
	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);
		if (!command) return;
		command.execute(interaction)
			.then((response) => {
				writeToLogFile(interaction.user.username, `${interaction.commandName} ${response}`);
				if (interaction.replied) {
					if (!interaction.ephemeral) {
						interaction.channel.send({ content:response });
						interaction.deleteReply();
					}
					else {
						interaction.editReply({ content:response, components:[] });
						// console.log(interaction);
					}
				}
				else {
					interaction.reply({ content: response });
				}
			})
			.catch((err) => {
				writeToLogFile(interaction.user.username, `${interaction.commandName} ${err}`);
				const msgObj = { content: `Failure!!! ${err}`, components: [] };
				if (interaction.replied) {
					interaction.channel.send(msgObj);
					if (!interaction.ephemeral) {
						interaction.deleteReply();
					}
					else {
						interaction.editReply(msgObj);
					}
				}
				else {
					interaction.reply(msgObj);
				}
			});
	}

	if (interaction.isSelectMenu()) {
		// console.log(interaction.values);
		//
	}
});
client.login(process.env.TOKEN);