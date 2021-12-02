const { MessageEmbed } = require('discord.js');

exports.getListDockerEmbed = function(containerArr) {
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
};

function getNames(containerArr) {
	containerNames = '';
	containerArr.forEach(({ name }) => {
		containerNames += `${name}\n`;
	});
	console.log(containerNames);
	return containerNames;
}

function getStatus(containerArr) {
	containerStatus = '';
	containerArr.forEach(({ status }) => {
		containerStatus += `${status}\n`;
	});
	console.log(containerStatus);
	return containerStatus;
}