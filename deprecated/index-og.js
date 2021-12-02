require('dotenv').config();
const { Client, Intents, Constants } = require('discord.js');
const users = require('./users-og.js');
const mentions = require('../scripts/mentions.js');
const dockerInfo = require('../scripts/dockerInfo.js');
const message = require('../scripts/message.js');
const { writeToLogFile } = require('../scripts/file.js');
const { no_containers } = require ('../json/errors.json');
const { guildId } = require ('../json/config.json');
const { VOTE_AGREEMENT, NO_RESTART, RESTARTED, STOPPED, STARTED } = require ('../json/responses.json');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

const KEYWORDS = {
	LIST: '!listcontainers,!listdockers,!lc,!ld'.split(','),
	FORCE_RESTART: '!forcerestart',
	RESTART: '!restart',
	// STATUS: "!status",
	START: '!start',
	STOP: '!stop',
	ASSIGN: '!assign',
	UNASSIGN: '!unassign',
	OPTIONS: '!options',
};

client.on('ready', () => {
	writeToLogFile('NONE', `Logged in as ${client.user.tag}!`);
	console.log(`Logged in as ${client.user.tag}!`);

	const guild = client.guilds.cache.get(guildId);
	let commands;

	if (guild) {
		commands = guild.commands;
	}
	else {
		commands = client.application?.commands;
	}

	commands?.create({
		name: 'ping',
		description: 'Replies with pong.',
	});

	commands?.create({
		name: 'add',
		description: 'Adds two numbers',
		options: [
			{
				name: 'number1',
				description: 'The first number.',
				required: true,
				type: Constants.ApplicationCommandOptionTypes.NUMBER,
			},
			{
				name: 'number2',
				description: 'The second number.',
				required: true,
				type: Constants.ApplicationCommandOptionTypes.NUMBER,
			},
		],
	});
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName, options } = interaction;

	if (commandName === 'ping') {
		interaction.reply({
			content: 'pong',
			ephemeral: true,
		});
	}
	else if (commandName === 'add') {
		const num1 = options.getNumber('number1') || 0;
		const num2 = options.getNumber('number2') || 0;
		const sum = `The sum is ${num1 + num2}`;
		interaction.reply({
			content: sum,
			ephemeral: true, // Only the user can see this reply
		});
	}
});

client.on('messageCreate', async (msg) => {
	const contentArray = msg.content.split(' ');
	let lastMention = 0;
	let containerName = '';
	const keys = Object.keys(KEYWORDS);
	const author = msg.author;
	if (keys.findIndex((key) => { return KEYWORDS[key] === contentArray[0] || KEYWORDS[key].indexOf(contentArray[0]) !== -1; }) !== -1) {
		msg.channel.sendTyping();
		switch (contentArray[0].toLowerCase()) {
		case KEYWORDS.LIST[0]:
		case KEYWORDS.LIST[1]:
		case KEYWORDS.LIST[2]:
		case KEYWORDS.LIST[3]:
			dockerInfo.getValidContainersNames(author).then((containerArr) => {
				Promise.all(containerArr).then((results) => {
					msg.channel.send({ embeds:[message.getListDockerEmbed(results)] });
				});
			}).catch((err) => {
				console.log(err);
				msg.channel.send(no_containers);
			});
			break;
		case KEYWORDS.FORCE_RESTART:
			containerName = contentArray[1];
			writeToLogFile(author.username, `Force restart on ${containerName}`);
			restartDocker(author, containerName, msg);
			break;
		case KEYWORDS.RESTART:
			containerName = contentArray[1];
			users.runVoting(author, containerName, msg).then((m) => {
				m.reply(`${VOTE_AGREEMENT}`);
				writeToLogFile(author.username, `Restart on ${containerName}`);
				restartDocker(author, containerName, m);
			}).catch((m) => {
				m.reply(`${NO_RESTART}`);
			});
			break;
		case KEYWORDS.START:
			containerName = contentArray[1];
			writeToLogFile(author.username, `Started ${containerName}`);
			dockerInfo.containerAction(author, containerName, dockerInfo.DOCKER_ACTIONS.START).then((cn) => {
				msg.channel.send(`${cn} ${STARTED}`);
			}).catch((status) => {
				msg.channel.send(`${status}`);
			});
			break;
		case KEYWORDS.STOP:
			containerName = contentArray[1];
			writeToLogFile(author.username, `Stopped ${containerName}`);
			dockerInfo.containerAction(author, containerName, dockerInfo.DOCKER_ACTIONS.STOP).then((cn) => {
				msg.channel.send(`${cn} ${STOPPED}`);
			}).catch((status) => {
				msg.channel.send(`${status}`);
			});
			break;
		case KEYWORDS.ASSIGN:
			lastMention = mentions.getLastMention(contentArray, msg.mentions.members);
			containerName = contentArray[lastMention + 1];
			const role = contentArray[lastMention + 2];
			msg.mentions.members.forEach((member) => {
				const status = users.addUser(author, member, containerName, role);
				msg.channel.send(adjustedUserTag `Add${status}${member}${containerName}`);
			});
			break;
		case KEYWORDS.UNASSIGN:
			lastMention = mentions.getLastMention(contentArray, msg.mentions.members);
			containerName = contentArray[lastMention + 1];
			msg.mentions.members.forEach((member) => {
				const status = users.removeUser(author, member, containerName);
				msg.channel.send(adjustedUserTag `Remove${status}${member}${containerName}`);
			});
			break;
		case KEYWORDS.OPTIONS:
			// TODO create own embed
			const keys = Object.keys(KEYWORDS);
			const keywordsArr = keys.map((key) => {
				return {
					name : key,
					status : typeof KEYWORDS[key] === 'string' ? KEYWORDS[key] : KEYWORDS[key].join(' '),
				};
			});
			msg.channel.send({ embeds:[message.getListDockerEmbed(keywordsArr)] });
			break;
		default:
			break;
		}
	}
});

function restartDocker(author, containerName, msg) {
	dockerInfo.containerAction(author, containerName, dockerInfo.DOCKER_ACTIONS.RESTART)
		.then((cn) => {msg.channel.send(`${cn} ${RESTARTED}`);})
		.catch((status) => {msg.channel.send(`${status}`);});
}

function adjustedUserTag(strings, status, member, container) {
	let action = strings[0];
	const postfix = action.toLowerCase() === 'remove' ? 'd' : 'ed';
	const preposition = action.toLowerCase() === 'add' ? 'to' : 'from';

	action = status ? `${action}${postfix}` : `Unable to ${action.toLowerCase()}`;
	return `${action} ${member.displayName} ${preposition} ${container}`;
}

client.login(process.env.TOKEN);