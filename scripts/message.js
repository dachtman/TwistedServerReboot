const { MessageActionRow, MessageSelectMenu, MessageEmbed, MessageButton } = require('discord.js');

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

module.exports = {
	getSelectMenu,
	getListDockerEmbed,
	createOptions,
	getButtonRow
};