/////////////////////////////////////////////////////////////
//////////////////////// Bandit ML //////////////////////////
/////////////////////////////////////////////////////////////

// ___________________▒▒██▒▒▒▒▒▒▒▒▒▒░░_______________________
// ___________________▒▒████████████████_____________________
// ___________________████████████████████___________________
// _________________░░████████████████████___________________
// _________________░░████░░░░░░██░░░░▒▒██___________________
// _________________░░██░░░░░░░░▓▓░░░░▒▒██___________________
// ___________________████░░░░░░░░░░░░▒▒_____________________
// ___________________▒▒██████▓▓▓▓▓▓▓▓██_____________________
// _____________________████████▓▓▓▓▓▓▓▓██___________________
// _____________________▓▓██████████████▓▓___________________
// _______________________▓▓██████████▓▓_____________________
// ___________________▒▒▒▒▒▒▓▓▓▓▓▓▓▓▒▒_______________________
// _______________▒▒▒▒▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░______________████___
// ___________░░░░▒▒▒▒__▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒______________████___
// _______░░░░__________▓▓▒▒▒▒▒▒▒▒▒▒▒▒__░░░░______░░░░_______
// _______░░░░__________▓▓▒▒▒▒▒▒▒▒▒▒▒▒____░░░░____░░_________
// _______░░░░__________▓▓▒▒▒▒▒▒▒▒▒▒▒▒______░░░░░░___________
// _______░░░░__________▓▓▒▒▒▒▒▒▒▒▒▒▒▒________░░░░___________
// _______▒▒▒▒__________▓▓▒▒▓▓▒▒▒▒▒▒▒▒_______________________
// _______████__________▓▓▓▓▓▓▒▒▒▒▒▒░░_______________________
// _______████__________▓▓▓▓▓▓▓▓░░▓▓▒▒_______________________
// _______▒▒▒▒__________▓▓▓▓▓▓▓▓▒▒▓▓▒▒_______________________
// _____________________████████████▓▓_______________________
// _____________________██▓▓______██▓▓_______________________
// _______░░____________████______▒▒██_______________________
// _____▒▒██____________████________██▒▒_____________________
// ___▓▓████████________██▒▒________░░██_____________________
// ___▓▓____▓▓▓▓████__▒▒▓▓__________░░██_____________________
// _____________▒▒▒▒██▓▓______________▒▒██___________________
// _________________░░░░______________░░██▒▒_________________
// _____________________________________▓▓██░░__░░___________
// _______________________________________████▒▒▓▓___________
// _________________________________________████_____________
// _________________________________________██_______________


function BanditAPI (apiKey) {
  this.contextValidationKey = "banditMLContextValidation";
  this.storage = window.localStorage;

  // bandit backend information
  this.banditApikey = apiKey;
  // const banditHostUrl = "https://www.16ounc.es/api/";
  const banditHostUrl = "http://localhost:8000/api/";
  this.banditDecisionEndpoint = banditHostUrl + "decision";
  this.banditLogRewardEndpoint = `${banditHostUrl}reward`;
  this.banditLogDecisionEndpoint = `${banditHostUrl}log_decision`;
  this.banditValidationEndpoint = `${banditHostUrl}validate`;

  // URLs & hosts
  this.ipUrl = "https://api.ipify.org?format=json";
}

BanditAPI.prototype.assert = function(condition, message) {
  if (!condition) {
    message = message || "Assertion failed.";
    message += " Contact support@banditml.com for assistance.";
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message;
  }
};

BanditAPI.prototype.isFunction = function(functionToCheck) {
  if (!functionToCheck) {
    return false;
  }
  const functionStr = {}.toString.call(functionToCheck);
  return functionStr === '[object Function]' || functionStr === '[object AsyncFunction]';
};

BanditAPI.prototype.asyncGetRequest = async function(
  url,
  params = {},
  headers = {}
) {
  if (params) {
    url += '?'
  }
  for (const paramName in params) {
    const body = params[paramName];
    if (paramName != null && body != null) {
      const data = encodeURIComponent(JSON.stringify(body));
      url += `${paramName}=${data}&`;
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: headers
  });
  return await response.json();
};

BanditAPI.prototype.asyncPostRequest = async function postData(
  url = '',
  headers = {},
  data = {}
) {
  // default to application/json
  if (!headers.hasOwnProperty('Content-Type')) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return await response.json(); // parses JSON response into native JavaScript objects
};

BanditAPI.prototype.getItemFromStorage = function (storageKey) {
  return JSON.parse(this.storage.getItem(storageKey));
};

BanditAPI.prototype.contextName = function(experimentId) {
  return `banditMLContext-${experimentId}`
};

BanditAPI.prototype.getContext = function(experimentId) {
  return this.getItemFromStorage(this.contextName(experimentId));
};

BanditAPI.prototype.validateFeaturesInContext = function (context, contextValidation) {
  const self = this;
  for (const featureName in context) {
    if (featureName === "ipAddress") {
      continue;
    }

    // self.assert(featureName in contextValidation, `Feature ${featureName} is not recognized. Please update your model in Bandit ML to include the feature.`);
    const possibleValues = contextValidation[featureName];
    if (possibleValues === null) {
      continue;
    }
    if (Array.isArray(possibleValues)) {
      const value = context[featureName];
      self.assert(
        possibleValues.includes(context[featureName]),
        `Value ${value} is not recognized among possible values for feature ${featureName}. Please update the possible values in Bandit ML.`
      );
    }
  }
  return true;
};

BanditAPI.prototype.validateContext = function(context, experimentId) {
  const self = this;
  self.assert(
    typeof context === 'object' && context !== null,
    "Context must be a non-null object."
  );
  let contextValidation = self.getItemFromStorage(self.contextValidationKey);
  if (!contextValidation) {
    const validationPromise = self.asyncGetRequest(
      url = self.banditValidationEndpoint,
      params = {experimentId: experimentId},
      headers = {
        "Authorization": `ApiKey ${self.banditApikey}`
      }
    );
    return validationPromise.then(response => {
      contextValidation = response;
      self.setItemInStorage(self.contextValidationKey, contextValidation);
      return self.validateFeaturesInContext(context, contextValidation)
    });
  }
  return self.validateFeaturesInContext(context, contextValidation);
};

BanditAPI.prototype.setItemInStorage = function(key, obj) {
  this.storage.setItem(key, JSON.stringify(obj));
};

BanditAPI.prototype.setContext = function(obj, experimentId) {
  try {
    this.validateContext(obj, experimentId);
    this.setItemInStorage(this.contextName(experimentId), obj);
  } catch(e) {
    console.error(e);
  }
};

BanditAPI.prototype.clearContext = function() {
  this.storage.removeItem(this.contextName);
};

BanditAPI.prototype.updateContext = function(newContext, experimentId) {
  // TODO: make this function async? benefit: make initial call non-blocking
  const self = this;
  self.assert(
    typeof newContext === 'object' && newContext !== null,
    "newContext must be a non-null object."
  );
  let context = self.getContext(experimentId);
  if (context == null) {
    context = newContext;
  } else {
    context = Object.assign({}, context, newContext);
  }
  self.setContext(context, experimentId);
};

BanditAPI.prototype.getControlRecs = async function (defaultProductRecs) {
  const self = this;
  self.assert(
    Array.isArray(defaultProductRecs) || self.isFunction(defaultProductRecs),
    "defaultProductRecs must be an array or function.");
  let productRecIds;
  // defaultProductRecs can be array of IDs
  if (Array.isArray(defaultProductRecs)) {
    productRecIds = defaultProductRecs;
  } else {
    // defaultProductRecs could also be a function that returns IDs or an async function that returns promise of IDs
    let result = defaultProductRecs();
    if (result && result.then) {
      // if fn returns a promise, we await it then expect ids to be returned
      productRecIds = await result;
    } else {
      productRecIds = result;
    }
  }
  return productRecIds;
};

BanditAPI.prototype.setRecs = async function (
  productRecIds = null,
  filterRecs = null,
  populateProductRecs = null
) {
  const self = this;
  self.validateDecision(productRecIds);
  if (filterRecs) {
    self.assert(self.isFunction(filterRecs), "filterRecs must be a function.");
    // filterRecs can be function that directly returns IDs or promise
    let result = filterRecs(productRecIds);
    if (result && result.then) {
      productRecIds = await result;
    }
  }
  if (populateProductRecs) {
    self.assert(
      self.isFunction(populateProductRecs),
      "populateProductRecs must be a function."
    );
    let result = populateProductRecs(productRecIds);
    if (result && result.then) {
      productRecIds = await result;
    }
  }
  return productRecIds;
};

BanditAPI.prototype.getDecision = async function (
  experimentId,
  defaultProductRecs = null,
  filterRecs = null,
  populateProductRecs = null,
  shouldLogDecision = true
) {
  const self = this;
  if (experimentId !== null) {
    self.assert(
      experimentId !== null && typeof experimentId === "string",
      "experimentId needs to be non-null string."
    );
  }
  // set the IP address before making a decision and logging context
  let ipPromise = self.asyncGetRequest(self.ipUrl);
  ipPromise.then(response => {
    return response;
  }).then(data => {
    self.updateContext({ipAddress: data.ip}, experimentId);
  });

  // call gradient-app and get a decision
  let context = self.getContext(experimentId);
  try {
    self.validateContext(context, experimentId);
  } catch (e) {
    console.error(e);
    return self.setRecs(await self.getControlRecs(defaultProductRecs), filterRecs, populateProductRecs);
  }

  let decisionPromise = self.asyncGetRequest(
    url = self.banditDecisionEndpoint,
    params = {context: context, experimentId: experimentId},
    headers = {
      "Authorization": `ApiKey ${self.banditApikey}`
    }
  );
  return decisionPromise.then(async (response) => {
    let loggedDecision = response;
    let productRecIds;
    if (defaultProductRecs) {
      if (response.isControl) {
        productRecIds = await self.getControlRecs(defaultProductRecs);
      } else {
        productRecIds = response.decision;
      }
    } else {
      productRecIds = response.decision;
    }
    productRecIds = await self.setRecs(productRecIds, filterRecs, populateProductRecs);
    loggedDecision.decision = productRecIds;
    if (shouldLogDecision) {
      self.logDecision(context, loggedDecision);
    }
    return response;
  }).catch(function(e) {
    console.error(e);
    return self.getControlRecs(defaultProductRecs);
  });
};

BanditAPI.prototype.validateDecision = function(decision) {
  const decisionType = typeof decision;
  this.assert(
    Array.isArray(decision) ||
    decisionType === "number" ||
    decisionType === "string",
    "decision must be an array, number, or string"
  );
};

BanditAPI.prototype.logDecision = function(context, decisionResponse) {
  const decision = decisionResponse.decision;
  this.validateDecision(decision);
  const headers = {
    "Authorization": `ApiKey ${this.banditApikey}`
  };
  this.asyncPostRequest(this.banditLogDecisionEndpoint, headers, {
    context: context,
    decision: decision
  }).then(response => {
    return response;
  });
};

BanditAPI.prototype.logReward = function(decisionId, reward) {
  const headers = {
    "Authorization": `ApiKey ${this.banditApikey}`
  };
  this.assert(
    reward && typeof reward === 'object', "Reward needs to be a non-empty object.");
  this.asyncPostRequest(this.banditLogRewardEndpoint, headers, {
    decisionId: decisionId,
    reward: reward,
  }).then(response => {
    return response;
  });
};
