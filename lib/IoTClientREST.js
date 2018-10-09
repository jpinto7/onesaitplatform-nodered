const join = (axios, { clientPlatform, clientPlatformId, token }) => {
  return new Promise((resolve, reject) => {
    axios.get('client/join', {
      params: {
        token,
        clientPlatform,
        clientPlatformId
      }
    })
    .then(({ data: { sessionKey = '' } = {}}) => {
      if (sessionKey) {
        axios.defaults.headers.common['Authorization'] = sessionKey;
        resolve(sessionKey);
      } else {
        throw new Error('No existe la propiedad sessionKey');
      }
    })
    .catch(error => {
      reject(error);
    });
  })
};

const leave = axios => {
  return new Promise((resolve, reject) => {
    axios.get('client/leave')
      .then(({ data = {} }) => {
        delete axios.defaults.headers.common['Authorization'];
        resolve(data);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const insert = (axios, { data: insertData, ontology }) => {
  return new Promise((resolve, reject) => {
    axios.post(`ontology/${ontology}`, {
      [`${ontology}`]: insertData
    })
    .then(({ data = {} }) => {
      resolve(data);
    })
    .catch(error => {
      reject(error);
    });
  });
};

module.exports = {
  join,
  leave,
  insert
};