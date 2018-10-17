module.exports = function(RED) {
	const restClient = require('../lib/IoTClientREST');

	function OnesaitPlatformInsert(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		const server = RED.nodes.getNode(config.server);
		node.ontology = config.ontology;

	  function insertOntology(data, ontology, tries) {
			return new Promise((resolve, reject) => {
				function insert() {
					restClient.insert(server.axiosAgent, {
						data,
						ontology
					}).then(response => {
						resolve(response);
					}).catch((error) => {
						if (((error.response && error.response.status === 401) || error.code === 'ECONNABORTED') && tries-- > 0) {
							console.log('Retrying insert...');
							tryInsert();
						} else {
							reject(error);
						}
					});
				}

				function tryInsert() {
					if (server.isConnected) {
						insert();
					} else {
						if (server.retries === tries) {
							console.log('No previous sessionKey');
						} else {
							console.log('Retrying sessionKey generation...');
						}
						server.generateSession()
						.then(() => {
							insert();
						})
						.catch((error) => {
							console.log('error', error);
							if (((error.response && error.response.status === 401) || error.code === 'ECONNABORTED') && tries-- > 0) {
								tryInsert();							
							} else {
								reject(error);
							}
						});
					}					
				}

				tryInsert();
			});
		};
		
		node.on('input', function(msg) {
			if (server) {
				const protocol = server.protocol;
				const ontology = node.ontology == '' ? msg.ontology : node.ontology;
				console.log(`Using protocol: ${protocol}`);
				console.log(`Using ontology: ${ontology}`);
				
				if (protocol.toUpperCase() == 'REST'.toUpperCase()) {
					insertOntology(msg.payload, ontology, server.retries)
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