require('dotenv').config();
const { readdirSync } = require('fs');
const { Client, Intents, Collection } = require('discord.js');
const { sendResults } = require('./scripts/message');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});
client.commands = new Collection();
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
commandFiles.filter((file) => file !== 'getfile.js').forEach((file) => {
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
			sendResults(interaction, response);
		})
		.catch((err) => {
			sendResults(interaction, err, 'Failure');
		});
	}
});
client.login(process.env.TOKEN);