const { MessageActionRow, MessageSelectMenu, MessageEmbed, MessageButton } = require('discord.js');
const { writeToLogFile } = require('./file');
const CONTAINER_NAME = 'container';
const SELECT_MENU = 'SELECT_MENU';
const TIME = 60000;
const ERRORS = ['time'];

function getSelectMenu(customID, options, minValues, placeHolder = 'Nothing selected',) {
	const selectMenu = new MessageSelectMenu()
		.setCustomId(customID)
		.setPlaceholder(placeHolder)
		.addOptions(options);
	if (minValues) {
		selectMenu.setMinValues(minValues);
	}
	return {
		content: 'Please select a container',
		components : [new MessageActionRow().addComponents(selectMenu)],
		ephemeral: true
	};
}

function createOptions({ name:label }) {
	return {
		label,
		value:label.toLowerCase()
	};
}

function getButtonRow(buttonsArray) {
	const row = new MessageActionRow();
	buttonsArray.forEach((buttonDef) => {
		row.addComponents(getButton(buttonDef));
	});
	return row;
}

function getButton({ customID, label, style }) {
	return new MessageButton()
		.setCustomId(customID)
		.setLabel(label)
		.setStyle(style);
}


function getListDockerEmbed(containerArr) {
	const planetExpressEmbed = new MessageEmbed();
	planetExpressEmbed.setColor('#FFA500');
	planetExpressEmbed.setTitle('Docker containers on PlanetExpress');
	// planetExpressEmbed.addField('Name',getNames(containerArr), true)
	// planetExpressEmbed.addField('Status',getStatus(containerArr), true)

	containerArr.forEach(({ name, status }) => {
		planetExpressEmbed.addField(`${name}`, `${status}`, true);
	});
	// .addField('Inline field title', 'Some value here', true)
	// .setImage('https://i.imgur.com/AfFp7pu.png')
	planetExpressEmbed.setTimestamp();
	// .setFooter('Some footer text here');//, 'https://i.imgur.com/AfFp7pu.png');
	return planetExpressEmbed;
}

function sendInteractionSelectMenuReply(interaction, containers) {
	return new Promise((resolve, reject) => {
		const { channel, user:{ id:authorID } } = interaction;
		if (containers.length !== 0) {
			interaction.reply(getSelectMenu(CONTAINER_NAME, containers.sort(alphabeticalSort).map(createOptions)))
				.then(() => {
					// TODO
					// console.log(arguments);
					const filter = i => {
						i.deferUpdate();
						return i.user.id === authorID;
					};
					channel.awaitMessageComponent({ filter, componentType: SELECT_MENU, time: TIME, errors:ERRORS })
					.then(resolve)
					.catch(reject);
				})
				.catch(reject);
		}
		else {
			reject('Sorry no containers for you');
		}
	});
}

function sendResults(interaction, response, prefix) {
	writeToLogFile(interaction.user.username, `${prefix ? prefix + ' ' : ''}${interaction.commandName} ${response}`);
	response = response.embeds ? response : { content:response, components:[] };
	if (interaction.replied) {
		if (!interaction.ephemeral) {
			interaction.channel.send(response);
			interaction.deleteReply();
		}
		else {
			interaction.editReply(response);
		}
	}
	else {
		interaction.reply(response);
	}
}

function alphabeticalSort({ name:aName }, { name:bName }) {
	aName = aName.toLowerCase();
	bName = bName.toLowerCase();
	return aName > bName ? 1 : -1;
}


module.exports = {
	getSelectMenu,
	getListDockerEmbed,
	createOptions,
	getButtonRow,
	sendInteractionSelectMenuReply,
	sendResults
};