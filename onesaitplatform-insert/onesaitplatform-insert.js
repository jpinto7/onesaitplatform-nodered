module.exports = function(RED) {
	const axios = require('../lib/axiosInstance');
	const restClient = require('../lib/IoTClientREST');

	function OnesaitPlatformInsert(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		const server = RED.nodes.getNode(config.server);
		node.ontology = config.ontology;

	  function insertData(data, ontology, tries) {
			return new Promise((resolve, reject) => {
				function insert() {
					restClient.insert(server.axiosAgent, {
						data,
						ontology
					}).then(response => {
						resolve(response);
					}).catch((error) => {
						console.log('huhu');
						if (error.response && error.response.status === 401 && tries-- > 0) {
							retryInsert();
						} else {
							reject(error);
						}
					});
				}

				function retryInsert() {
					server.generateSession()
					.then(() => {
						insert();
					})
					.catch((error) => {
						if (error.response && error.response.status === 401) {
							console.log('Retrying...');
							insert();							
						} else {
							reject(error);
						}
					});					
				}

				if (server.sessionKey) {
					insert();
				} else {
					console.log('No previous sessionKey');
					retryInsert();
				}
			});
		};
		
		node.on('input', function(msg) {
			if (server) {
				const protocol = server.protocol;
				const ontology = node.ontology == '' ? msg.ontology : node.ontology;
				console.log(`Using protocol: ${protocol}`);
				console.log(`Using ontology: ${ontology}`);
				
				if (protocol.toUpperCase() == 'REST'.toUpperCase()) {
					insertData(msg.payload, ontology, 5)
						.then(response => {
							msg.payload = response;
							node.send(msg);
						})
						.catch(error => {
							if (error.response) {
								console.log(`Error status: ${error.response.status}`);
								console.log(`Error message: ${error.response.data}`);
							} else {
								console.log(`Error message: ${error.message}`);
							}
							node.error(error);
						});
				}
			}
		});
	}

	RED.nodes.registerType('onesaitplatform-insert', OnesaitPlatformInsert);
}