module.exports = function(RED) {
	const restClient = require('../lib/IoTClientREST');

	function OnesaitPlatformQuery(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		const server = RED.nodes.getNode(config.server);
		node.ontology = node.ontology;
		node.query = node.query;
		node.queryType = node.queryType;
	
	  function queryOntology(queryType, query, ontology, tries) {
			return new Promise((resolve, reject) => {
				function doQuery() {
					restClient.query(server.axiosAgent, {
						queryType,
						query,
						ontology
					}).then(response => {
						resolve(response);
					}).catch((error) => {
						if (((error.response && error.response.status === 401) || error.code === 'ECONNABORTED') && tries-- > 0) {
							console.log('Retrying query...');
							tryQueryOntology();
						} else {
							reject(error);
						}
					});
				}

				function tryQueryOntology() {
					if (server.isConnected) {
						doQuery();
					} else {
						if (server.retries === tries) {
							console.log('No previous sessionKey');
						} else {
							console.log('Retrying sessionKey generation...');
						}
						server.generateSession()
						.then(() => {
							doQuery();
						})
						.catch((error) => {
							console.log('error', error);
							if (((error.response && error.response.status === 401) || error.code === 'ECONNABORTED') && tries-- > 0) {
								tryQueryOntology();							
							} else {
								reject(error);
							}
						});
					}					
				}

				tryQueryOntology();
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
						queryOntology(queryType, query, ontology, server.retries)
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

	RED.nodes.registerType('onesaitplatform-query', OnesaitPlatformQuery);
}