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
        throw new Error('No sessionKey was found');
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
      .then(({ data: { message = '' } = {} }) => {
        delete axios.defaults.headers.common['Authorization'];
        resolve(message);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const insert = (axios, { data: insertData, ontology }) => {
  return new Promise((resolve, reject) => {
    axios.post(`ontology/${ontology}`, {
      ...insertData
    })
    .then(({ data = {} }) => {
      resolve(data);
    })
    .catch(error => {
      reject(error);
    });
  });
};

const deleteByQuery = (axios, { queryType, query, ontology }) => {
  return new Promise((resolve, reject) => {
    axios.get(`ontology/${ontology}/delete`, {
      params: {
        query,
        queryType
      }
    })
    .then(({ data = {} }) => {
      resolve(data);
    })
    .catch(error => {
      reject(error);
    });
  });
};

const deleteById = (axios, { id, ontology }) => {
  return new Promise((resolve, reject) => {
    axios.delete(`ontology/${ontology}/${id}`)
    .then(({ data = {} }) => {
      resolve(data);
    })
    .catch(error => {
      reject(error);
    });
  });
};

const updateByQuery = (axios, { queryType, query, ontology }) => {
  return new Promise((resolve, reject) => {
    axios.get(`ontology/${ontology}/update`, {
      params: {
        query,
        queryType
      }
    })
    .then(({ data = {} }) => {
      resolve(data);
    })
    .catch(error => {
      reject(error);
    });
  });
};

const updateById = (axios, { id, data: updateData, ontology }) => {
  return new Promise((resolve, reject) => {
    axios.put(`ontology/${ontology}/${id}`, {
      ...updateData
    })
    .then(({ data = {} }) => {
      resolve(data);
    })
    .catch(error => {
      reject(error);
    });
  });
};

const query = (axios, { queryType, query, ontology }) => {
  return new Promise((resolve, reject) => {
    axios.get(`ontology/${ontology}`, {
      params: {
        query,
        queryType
      }
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
  insert,
  deleteByQuery,
  deleteById,
  updateByQuery,
  updateById,
  query
};