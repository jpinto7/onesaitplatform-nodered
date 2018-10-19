module.exports = function(RED) {
	const restClient = require('../lib/IoTClientREST');

	function OnesaitPlatformUpdate(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		const server = RED.nodes.getNode(config.server);
		node.ontology = config.ontology;
		node.query = config.query;
		node.queryType = config.queryType;

	  function updateQueryOntology(queryType, query, ontology, tries) {
			return new Promise((resolve, reject) => {
				function updateQuery() {
					restClient.updateByQuery(server.axiosAgent, {
						queryType,
						query,
						ontology
					}).then(response => {
						resolve(response);
					}).catch((error) => {
						if (((error.response && error.response.status === 401) || error.code === 'ECONNABORTED') && tries-- > 0) {
							console.log('Retrying update...');
							tryupdateQuery();
						} else {
							reject(error);
						}
					});
				}

				function tryupdateQuery() {
					if (server.isConnected) {
						updateQuery();
					} else {
						if (server.retries === tries) {
							console.log('No previous sessionKey');
						} else {
							console.log('Retrying sessionKey generation...');
						}
						server.generateSession()
						.then(() => {
							updateQuery();
						})
						.catch((error) => {
							console.log('error', error);
							if (((error.response && error.response.status === 401) || error.code === 'ECONNABORTED') && tries-- > 0) {
								tryupdateQuery();							
							} else {
								reject(error);
							}
						});
					}					
				}

				tryupdateQuery();
			});
		};
		
		node.on('input', function(msg) {
			if (server) {
				const protocol = server.protocol;
				const ontology = !node.ontology ? msg.ontology : node.ontology;
				const queryType = !node.queryType ? msg.queryType : node.queryType;
				const query = !node.query ? msg.query : node.queryType;
				console.log(`Using protocol: ${protocol}`);
				console.log(`Using ontology: ${ontology}`);
				
				if (protocol.toUpperCase() == 'REST'.toUpperCase()) {
					updateQueryOntology(queryType, query, ontology, server.retries)
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
	RED.nodes.registerType('onesaitplatform-update', OnesaitPlatformUpdate);
}