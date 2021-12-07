require('dotenv').config();
const { readdirSync } = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId } = require('./json/config.json');

const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = commandFiles.filter(f => f !== 'getfile.js').map(file => {
	console.log(file);
	const { data } = require(`./commands/${file}`);
	return data.toJSON();
});

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body : commands })
	.then(() => console.log('Success'))
	.catch(console.error);

// const commandsDefinitions = require('./json/commands.json');
/*
const commands = [];
commandsDefinitions.forEach((command) => {
	const slashy = new SlashCommandBuilder();
	slashy.setDescription(command.description);
	if (command.options) {
		command.options.forEach((option) => {
			slashy[option.type]((opt) => {
				opt.setName(option.name).setDescription(option.description);
				if (option.required) {
					opt.setRequired(true);
				}
				// Look to do dynamic choices based on available users and containers
				if (option.choices) {
					option.choices.forEach((choice) => {
						opt.addChoice(choice.name, choice.value);
					});
				}
				return opt;
			});
		});
	}
	command.command_prompts.forEach((cp) => {
		slashy.setName(cp);
		commands.push(slashy.toJSON());
	});
});
*/
