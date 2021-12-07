const Docker = require('dockerode');
const { canUserDoThis, ROLES: { PLEEB, ADMIN } } = require('./users.js');
const { docker:{ protocol, host, port } } = require('../json/config.json');
const DOCKER_ACTIONS = {
	'RESTART' : 'restart',
	'STOP' : 'stop',
	'START' : 'start',
};

function getDocker() {
	return new Docker({
		protocol,
		host,
		port,
	});
}

function getContainers() {
	return new Promise((resolve, reject) => {
		const docker = getDocker();
		docker.listContainers({ all:true }).then((containers) => {
			containers = containers.map((container) => {
				const { Names:names } = container;
				return {
					name : names.toString().replace(/\//g, ''),
					... container
				};
			});
			resolve(containers);
		}).catch(reject);
	});
}

function getContainer(containerName) {
	return new Promise((resolve, reject) => {
		getContainers().then((containers) => {
			containers = containers.filter(({ name }) => {
				return containerName.toString().toLowerCase() === name.toLowerCase();
			});
			resolve(containers[0]);
		}).catch(reject);
	});
}

function getAllMyContainers(user) {
	return new Promise((resolve, reject) => {
		getMyContainers(user, PLEEB, false)
			.then((pleebContainers) => {
				getMyContainers(user, ADMIN, false)
					.then((adminContainers) => {
						resolve(getUniqContainerArray([...pleebContainers, ...adminContainers]));
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

function getMyContainers(user, requiredRole = PLEEB, ignoreSuperAdmins) {
	return new Promise((resolve, reject) => {
		getContainers()
			.then((containers) => {
				resolve(containers.filter(({ name }) => {
					return canUserDoThis(user, name, ignoreSuperAdmins, requiredRole);
				}));
			})
			.catch(reject);
	});
}

function getContainersInfo(author) {
	return new Promise((resolve, reject) => {
		getAllMyContainers(author)
			.then((containers) => {
				resolve(containers.map(({ name, State:status, Status:state }) => { return { name, state, status };}));
			})
			.catch(reject);
	});
}

function takeActionOnContainer(containerName, action) {
	return new Promise((resolve, reject) => {
		if (action) {
			getContainer(containerName).then(({ Id:id }) => {
				const docker = getDocker();
				docker.getContainer(id)[action]().then(() => {
					resolve(containerName);
				}).catch(reject);
			}).catch(reject);
		}
	});
}

function getUniqContainerArray(containers) {
	const uniqContainers = [];
	containers.forEach((container) => {
		const { name:cName } = container;
		const filtered = uniqContainers.filter(({ name:uName }) => {
			return uName === cName;
		});
		if (filtered.length === 0) {
			uniqContainers.push(container);
		}
	});
	return uniqContainers;
}

function alphabeticalSortContainers({ name:aName }, { name:bName }) {
	aName = aName.toLowerCase();
	bName = bName.toLowerCase();
	return aName > bName ? 1 : -1;
}

module.exports = {
	takeActionOnContainer,
	getContainersInfo,
	getContainers,
	getMyContainers,
	getAllMyContainers,
	alphabeticalSortContainers,
	DOCKER_ACTIONS
};
