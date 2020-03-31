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


function BanditAPI (apiKey, sessionLengthHrs) {
  this.storage = window.localStorage;

  // bandit backend information
  this.banditApikey = apiKey;
  // const banditHostUrl = "https://www.16ounc.es/api/";
  const banditHostUrl = "http://localhost:8000/api/";
  this.banditDecisionEndpoint = banditHostUrl + "decision";
  this.banditLogRewardEndpoint = `${banditHostUrl}reward`;
  this.banditLogDecisionEndpoint = `${banditHostUrl}log_decision`;
  this.banditValidationEndpoint = `${banditHostUrl}validate`;
  this.sessionIdKey = "BanditMLSessionId";
  this.lastActionTimeKey = "BanditMLLastActionTime";
  this.sessionLengthHrs = sessionLengthHrs || 2;
  this.rewardTypeClick = "click";

  // URLs & hosts
  this.ipUrl = "https://api.ipify.org?format=json";
}

BanditAPI.prototype.sessionDecisionsKey = function (experimentId) {
  return `BanditMLSessionDecisions-${experimentId}`;
};

BanditAPI.prototype.isTimeExpired = function (timeMs, numHrs) {
  const msInHr = 3600000;
  return (new Date().getTime() - timeMs) / msInHr > numHrs;
};

BanditAPI.prototype.uuidv4 = function() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};

BanditAPI.prototype.getSessionDecisions = function (experimentId) {
  // Session decisions are ordered by most recent
  return this.getItemFromStorage(this.sessionDecisionsKey(experimentId)) || [];
};

BanditAPI.prototype.updateSessionDecisions = function(decision) {
  let sessionDecisions = this.getSessionDecisions(experimentId);
  sessionDecisions.unshift(decision);
  this.setItemInStorage(this.sessionDecisionsKey(experimentId), sessionDecisions);
};

BanditAPI.prototype.updateSessionId = function() {
  // TODO: make session expiry configurable?
  // TODO: support case where client has their own session ID they track
  // Create new session ID tracked in local storage if it doesn't exist
  // If session ID already exists, create a new one if last tracked action was more than hour ago
  let sessionId = this.getItemFromStorage(this.sessionIdKey);
  let lastActionTimeMs = this.getItemFromStorage(this.lastActionTimeKey);
  if (!sessionId || !lastActionTimeMs ||
      this.isTimeExpired(lastActionTimeMs, this.sessionLengthHrs)) {
    let sessionId = this.uuidv4();
    this.setItemInStorage(this.sessionIdKey, sessionId);
    this.setItemInStorage(this.lastActionTimeKey, new Date().getTime());
  }
  return sessionId;
};

BanditAPI.prototype.clearSession = function() {
  this.storage.removeItem(this.sessionIdKey);
  this.storage.removeItem(this.lastActionTimeKey);
  this.storage.removeItem(this.sessionDecisionsKey);
};

BanditAPI.prototype.getSessionId = function() {
  // Get session ID from local storage or create one if it doesn't exist for some reason
  return this.getItemFromStorage(this.sessionIdKey) || this.updateSessionId();
  // TODO: support case where client has their own session ID they track
};

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
  if (params && Object.keys(params).length) {
    url += '?'
  }
  for (const paramName in params) {
    let body = params[paramName];
    if (paramName != null && body != null) {
      const bodyType = typeof body;
      let data;
      // no need to encode numbers / strings
      if (bodyType === "number" || bodyType === "string") {
        data = body;
      } else {
        data = encodeURIComponent(JSON.stringify(body));
      }
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

BanditAPI.prototype.contextValidationKey = function(experimentId) {
  return `banditMLContextValidation-${experimentId}`;
};

BanditAPI.prototype.getContext = function(experimentId) {
  return this.getItemFromStorage(this.contextName(experimentId));
};

BanditAPI.prototype.validateAndFilterFeaturesInContext = function (context, contextValidation) {
  const self = this;
  let filteredFeatures = {};
  for (const featureName in context) {
    if (featureName === "ipAddress") {
      filteredFeatures.ipAddress = context.ipAddress;
      continue;
    }

    const featureExists = contextValidation.hasOwnProperty(featureName);
    if (featureExists) {
      const value = context[featureName];
      const featureSpec = contextValidation[featureName];
      const possibleValues = featureSpec.possible_values;
      const featureType = featureSpec.type;
      filteredFeatures[featureName] = value;
      if (featureType === "N") {
        const valueType = typeof value;
        self.assert(typeof value === "number", `Feature ${featureName} is expected to be numeric, but ${value} of type ${valueType} was passed.`);
      } else if (featureType === "C") {
        self.assert(
          Array.isArray(possibleValues),
          `Feature ${featureName} is categorical, but its possible values is not an array. Update the model appropriately in Bandit ML.`
        );
        self.assert(
          possibleValues.includes(context[featureName]),
          `Value ${value} is not recognized among possible values for feature ${featureName}. Please update the possible values in Bandit ML.`
        );
      } else if (featureType === "P") {
        self.assert(
          Array.isArray(possibleValues),
          `Feature ${featureName} is a product set, but its possible values is not an array. Update the model appropriately in Bandit ML.`
        );
        self.assert(
          Array.isArray(value),
          `Feature ${featureName} is a product set that expects an array, but ${value} is not an array.`
        );
        self.assert(
          value.every(val => possibleValues.includes(val)),
          `${value} is not included in ${featureName}'s possible values ${possibleValues}.`
        );
      }
    } else {
      console.warn(`Feature ${featureName} is not recognized by the model. Please update your model to include this feature.`);
    }
  }
  return filteredFeatures;
};

BanditAPI.prototype.validateAndFilterContext = function(context, experimentId) {
  const self = this;
  self.assert(
    typeof context === 'object' && context !== null,
    "Context must be a non-null object."
  );
  let contextValidation = self.getItemFromStorage(self.contextValidationKey(experimentId));
  // load contextValidation if it doesn't exist or is more than 4 hours old
  if (!contextValidation || self.isTimeExpired(contextValidation.generated_at_ms, 4)) {
    const validationPromise = self.asyncGetRequest(
      url = self.banditValidationEndpoint,
      params = {experimentId: experimentId},
      headers = {
        "Authorization": `ApiKey ${self.banditApikey}`
      }
    );
    return validationPromise.then(response => {
      contextValidation = response;
      self.setItemInStorage(self.contextValidationKey(experimentId), contextValidation);
      return self.validateAndFilterFeaturesInContext(context, contextValidation)
    });
  }
  return self.validateAndFilterFeaturesInContext(context, contextValidation);
};

BanditAPI.prototype.setItemInStorage = function(key, obj) {
  this.storage.setItem(key, JSON.stringify(obj));
};

BanditAPI.prototype.setContext = function(obj, experimentId) {
  try {
    this.validateAndFilterContext(obj, experimentId);
    this.setItemInStorage(this.contextName(experimentId), obj);
  } catch(e) {
    console.error(e);
  }
};

BanditAPI.prototype.clearContext = function(experimentId) {
  this.storage.removeItem(this.contextName(experimentId));
};

BanditAPI.prototype.checkForShortTermReward = function(context, experimentId, rewardType) {
  const sessionDecisions = this.getSessionDecisions(experimentId);
  if (rewardType === this.rewardTypeClick) {
    // TODO: force currentlyViewingProduct to exist as a feature for model
    const currentProductId = context.currentlyViewingProduct;
    if (currentProductId) {
      for (let decision of sessionDecisions) {
        if (decision.ids && decision.ids.includes(currentProductId)) {
          // log reward for most recent decision that included this product
          // TODO: decide if this is best behavior or if we should only log for every decision
          this.logReward(decision, {[this.rewardTypeClick]: 1}, experimentId);
          break;
        }
      }
    }
  }
};

BanditAPI.prototype.updateContext = function(newContext, experimentId) {
  // TODO: make this function async? benefit: make initial call non-blocking
  const self = this;
  self.assert(
    typeof newContext === 'object' && newContext !== null,
    "newContext must be a non-null object."
  );
  self.assert(
    experimentId && typeof experimentId === "string",
    `experimentId must be non-null string. Got ${experimentId} instead`
  );
  let context = self.getContext(experimentId);
  if (context == null) {
    context = newContext;
  } else {
    context = Object.assign({}, context, newContext);
  }
  self.setContext(context, experimentId);
  self.updateSessionId();
  self.checkForShortTermReward(context, experimentId, this.rewardTypeClick);
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
  self.validateDecisionIds(productRecIds);
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

  let ipPromise = self.asyncGetRequest(self.ipUrl,
    params = {},
    headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  );
  ipPromise.then(async (response) => {
    self.updateContext({ipAddress: response.ip}, experimentId);
    let context = self.getContext(experimentId);
    try {
      context = self.validateAndFilterContext(context, experimentId);
    } catch (e) {
      console.error(e);
      return self.setRecs(await self.getControlRecs(defaultProductRecs), filterRecs, populateProductRecs);
    }

    // call gradient-app and get a decision
    let decisionPromise = self.asyncGetRequest(
      url = self.banditDecisionEndpoint,
      params = {context: context, experimentId: experimentId},
      headers = {
        "Authorization": `ApiKey ${self.banditApikey}`
      }
    );
    return decisionPromise.then(async (response) => {
      let loggedDecision = response;
      const originalIds = loggedDecision.decision.ids;
      let productRecIds;
      if (defaultProductRecs) {
        if (response.isControl) {
          productRecIds = await self.getControlRecs(defaultProductRecs);
        } else {
          productRecIds = originalIds;
        }
      } else {
        productRecIds = originalIds;
      }
      productRecIds = await self.setRecs(productRecIds, filterRecs, populateProductRecs);
      loggedDecision.decision.ids = productRecIds;
      // TODO: replace with logic to only log decision when element is seen
      if (shouldLogDecision) {
        self.logDecision(context, loggedDecision, experimentId);
      }
      return response;
    }).catch(function(e) {
      console.error(e);
      return self.getControlRecs(defaultProductRecs);
    });
  });
};

BanditAPI.prototype.validateDecisionIds = function(decisionIds) {
  const decisionIdsType = typeof decisionIds;
  this.assert(
    Array.isArray(decisionIds) ||
    decisionIdsType === "number" ||
    decisionIdsType === "string",
    "decision IDs must be an array, number, or string"
  );
};

BanditAPI.prototype.logDecision = function(context, decisionResponse, experimentId) {
  const decision = decisionResponse.decision;
  this.validateDecisionIds(decision.ids);
  const headers = {
    "Authorization": `ApiKey ${this.banditApikey}`
  };
  this.updateSessionDecisions(decision);
  this.asyncPostRequest(this.banditLogDecisionEndpoint, headers, {
    id: decisionResponse.id,
    context: context,
    decision: decision,
    experimentId: experimentId,
    mdpId: this.getSessionId(),
    variation_id: decision.variation_id
  }).then(response => {
    return response;
  });
};

BanditAPI.prototype.logReward = function(decision, reward, experimentId) {
  const headers = {
    "Authorization": `ApiKey ${this.banditApikey}`
  };
  this.assert(
    reward && typeof reward === 'object', "Reward needs to be a non-empty object.");
  this.asyncPostRequest(this.banditLogRewardEndpoint, headers, {
    decisionId: decision.id,
    decision: decision,
    metrics: reward,
    experimentId: experimentId,
    mdpId: this.getSessionId()
  }).then(response => {
    // TODO: clear session if reward is purchase(?)
    return response;
  });
};
