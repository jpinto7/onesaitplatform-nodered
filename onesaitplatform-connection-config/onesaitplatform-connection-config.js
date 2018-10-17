module.exports = function(RED) {
	//Invoca al constructor al desplegar el flujo
	const axios = require('axios');
	const https = require('https');
	const restClient = require('../lib/IoTClientREST');
	
	function OnesaitPlatformConfig(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		node.protocol = config.protocol;
		node.endpoint = config.endpoint;
		node.clientPlatform = config.clientPlatform;
		node.clientPlatformId = config.clientPlatformId;
		node.token = config.token;
		node.timeout = config.timeout || 1000;
		node.retries = config.retries || 1;
		node.sessionKey = '';
		node.isConnecting = false;
		node.isConnected = false;
		node.generateSession = generateSession;
		node.axiosAgent = createAgent();

		function generateSession() {
			console.log('Generating sessionKey...');
			return new Promise((resolve, reject) => {
				if (node.isConnecting) {
					resolve();
				} else {
					node.isConnecting = true;
					restClient.join(node.axiosAgent, { token, clientPlatform, clientPlatformId } = node)
					.then(sessionKey => {
						node.sessionKey = sessionKey;
						node.isConnected = true;
						node.isConnecting = false;
						console.log(`Connection successful with sessionKey: ${sessionKey}`);
						resolve();
					})
					.catch(error => {
						node.isConnecting = false;
						reject(error);
					});					
				}
			});
		}

		function createAgent() {
			return axios.create({
				baseURL: node.endpoint,
				responseType: 'json',
				timeout: node.timeout,
				httpsAgent: new https.Agent({  
					rejectUnauthorized: false
				})
			});
		}

		//Se invoca al cerrar y al redesplegar el flujo
		node.on('close', function () {
			console.log('Disconnecting...');

			if (node.isConnected) {
				restClient.leave(node.axiosAgent, { sessionKey } = node)
				.then(message => {
					console.log(`Disconnection message: ${message}`);
					console.log('Disconnection successful');
				})
				.catch(error => {
					if (error.response) {
						console.log('Error status: ', error.response.status);
						console.log('Error message: ', error.response.data);
					} else {
						console.log('Error message', error.message);
					}
				})
				.finally(() => {
					node.sessionKey = '';
					node.isConnected = false;
				});
			}
		});
	}

	RED.nodes.registerType('onesaitplatform-config', OnesaitPlatformConfig);
}