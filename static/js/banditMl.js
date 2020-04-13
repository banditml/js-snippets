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


function BanditAPI (apiKey, recClassByExperimentId = {}, config = {}) {
  this.storage = window.localStorage;

  // bandit backend information
  this.banditApikey = apiKey;
  this.sessionIdKey = "BanditMLSessionId";
  this.lastActionTimeKey = "BanditMLLastActionTime";
  this.recClassByExperimentId = recClassByExperimentId;
  this.decisionsLoggedById = {};
  let defaultConfig = {
    debugMode: false,
    sessionLengthHrs: 0.5,
    banditHostUrl: "https://www.banditml.com/api/",
    getSessionId: null
  };
  this.config = Object.assign(defaultConfig, config);
  this.banditDecisionEndpoint = `${this.config.banditHostUrl}decision`;
  this.banditLogRewardEndpoint = `${this.config.banditHostUrl}reward`;
  this.banditLogDecisionEndpoint = `${this.config.banditHostUrl}log_decision`;
  this.banditValidationEndpoint = `${this.config.banditHostUrl}validate`;

  // URLs & hosts
  this.ipUrl = "https://api.ipify.org?format=json";
}

BanditAPI.prototype.addDecisionHandler = function (context, decision, experimentId) {
  const self = this;
  const recClass = self.recClassByExperimentId[experimentId];
  // TODO: handle multiple rec elements?
  const elem = document.getElementsByClassName(recClass)[0];
  if (elem) {
    document.addEventListener("scroll", function () {
      // prevent dupe decision logging
      const decisionLogged = self.decisionsLoggedById[decision.id];
      if (!decisionLogged && elem.getBoundingClientRect().bottom <= window.innerHeight) {
        if (self.config.debugMode) {
          console.log("User has seen decision. Auto logging it.");
        }
        self.logDecision(context, decision, experimentId);
        self.decisionsLoggedById[decision.id] = true;
      }
    });
  }
};

BanditAPI.prototype.lastDecisionKey = function (experimentId) {
  return `BanditMLLastDecision-${experimentId}`;
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

BanditAPI.prototype.getLastDecision = function (experimentId) {
  return this.getItemFromStorage(this.lastDecisionKey(experimentId));
};

BanditAPI.prototype.updateLastDecision = function(decision, experimentId) {
  this.setItemInStorage(this.lastDecisionKey(experimentId), decision);
};

BanditAPI.prototype.updateSessionId = function() {
  // TODO: support case where client has their own session ID they track
  // Create new session ID tracked in local storage if it doesn't exist
  // If session ID already exists, create a new one if last tracked action was more than hour ago
  let sessionId = this.getItemFromStorage(this.sessionIdKey);
  let lastActionTimeMs = this.getItemFromStorage(this.lastActionTimeKey);
  if (!sessionId || !lastActionTimeMs ||
      this.isTimeExpired(lastActionTimeMs, this.config.sessionLengthHrs)) {
    let sessionId = this.uuidv4();
    this.setItemInStorage(this.sessionIdKey, sessionId);
    this.setItemInStorage(this.lastActionTimeKey, new Date().getTime());
  }
  return sessionId;
};

BanditAPI.prototype.clearSession = function() {
  this.storage.removeItem(this.sessionIdKey);
  this.storage.removeItem(this.lastActionTimeKey);
};

BanditAPI.prototype.getSessionId = function() {
  // If user has their own function for getSessionId, use it instead
  if (this.config.getSessionId) {
    return this.config.getSessionId();
  }
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
  return this.getItemFromStorage(this.contextName(experimentId)) || {};
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
      try {
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
            typeof value === "string" || Array.isArray(value),
            `Feature ${featureName} is a product set that expects an array or string, but ${value} is not an array or string.`
          );
          if (Array.isArray(value)) {
            self.assert(
              value.every(val => possibleValues.includes(val)),
              `${value} is not included in ${featureName}'s possible values ${possibleValues}.`
            );
          } else {
            self.assert(
              possibleValues.includes(value),
              `${value} is not included in ${featureName}'s possible values ${possibleValues}.`
            );
          }
        }
        filteredFeatures[featureName] = value;
      } catch (e) {
        console.error(e);
        console.error(`Not including ${featureName} in context due to invalid/unrecognized value.`)
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

BanditAPI.prototype.setContext = async function(obj, experimentId) {
  try {
    let context = this.validateAndFilterContext(obj, experimentId);
    if (context.then) {
      context = await context;
    }
    this.setItemInStorage(this.contextName(experimentId), context);
    return context || {};
  } catch(e) {
    console.error(e);
    return context || {};
  }
};

BanditAPI.prototype.clearContext = function(experimentId) {
  this.storage.removeItem(this.contextName(experimentId));
};

BanditAPI.prototype.updateContext = async function(newContext, experimentId) {
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
  context = self.setContext(context, experimentId);
  if (context.then) {
    context = await context;
  }
  self.updateSessionId();
  if (self.config.debugMode) {
    console.log('Updated context.');
    console.log(context);
  }
  return context;
};

BanditAPI.prototype.getControlRecs = async function (defaultDecisionIds) {
  const self = this;
  self.assert(
    Array.isArray(defaultDecisionIds) || self.isFunction(defaultDecisionIds),
    "defaultDecisionIds must be an array or function.");
  let decisionIds;
  // defaultDecisionIds can be array of IDs
  if (Array.isArray(defaultDecisionIds)) {
    decisionIds = defaultDecisionIds;
  } else {
    // defaultDecisionIds could also be a function that returns IDs or an async function that returns promise of IDs
    let result = defaultDecisionIds();
    if (result && result.then) {
      // if fn returns a promise, we await it then expect ids to be returned
      decisionIds = await result;
    } else {
      decisionIds = result;
    }
  }
  return decisionIds;
};

BanditAPI.prototype.setRecs = async function (
  decisionIds = null,
  filterRecs = null,
  populateDecisions = null
) {
  const self = this;
  if (decisionIds.then) {
    decisionIds = await decisionIds;
  }
  self.validateDecisionIds(decisionIds);
  if (filterRecs) {
    self.assert(self.isFunction(filterRecs), "filterRecs must be a function.");
    // filterRecs can be function that directly returns IDs or promise
    let result = filterRecs(decisionIds);
    if (result) {
      if (result.then) {
        decisionIds = await result;
      } else {
        decisionIds = result;
      }
    }
  }
  if (self.config.debugMode) {
    console.log("After filtering, the following recs will be shown:");
    console.log(decisionIds);
  }
  if (populateDecisions) {
    self.assert(
      self.isFunction(populateDecisions),
      "populateDecisions must be a function."
    );
    let result = populateDecisions(decisionIds);
    if (result) {
      if (result.then) {
        decisionIds = await result;
      } else {
        decisionIds = result;
      }
    }
  }
  return decisionIds;
};

BanditAPI.prototype.getDecision = async function (
  experimentId,
  defaultDecisionIds = null,
  filterRecs = null,
  populateDecisions = null,
  shouldLogDecision = true
) {
  const self = this;
  if (experimentId !== null) {
    self.assert(
      experimentId !== null && typeof experimentId === "string",
      "experimentId needs to be non-null string."
    );
  }

  function setErrorRecs(e) {
    console.error("Error getting decision, setting your default recs instead.")
    console.error(e);
    // TODO: deal with error case for user if defaultDecisionIds is null?
    return self.setRecs(self.getControlRecs(defaultDecisionIds), filterRecs, populateDecisions);
  }

  let context = self.getContext(experimentId);
  if (!('ipAddress' in context)) {
    let ipPromise = self.asyncGetRequest(self.ipUrl,
      params = {},
      headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    );
    let ipResult = await ipPromise;
    const ipAddress = ipResult.ip;
    try {
      context.ipAddress = ipAddress;
      context = self.updateContext(context, experimentId);
      if (context.then) {
        context = await context;
      }
    } catch (e) {
      return setErrorRecs(e);
    }
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
    if (self.config.debugMode) {
      console.log("Got a decision from Bandit.");
      console.log(loggedDecision);
    }
    let decisionIds;
    if (loggedDecision.decision.type === "D") {
      const originalIds = loggedDecision.decision.ids;
      if (defaultDecisionIds) {
        if (response.decision.isControl) {
          decisionIds = await self.getControlRecs(defaultDecisionIds);
        } else {
          decisionIds = originalIds;
        }
      } else {
        decisionIds = originalIds;
      }
      decisionIds = await self.setRecs(decisionIds, filterRecs, populateDecisions);
      loggedDecision.decision.ids = decisionIds;
    } else {
      decisionIds = loggedDecision.decision.ids;
      await self.setRecs(decisionIds, filterRecs, populateDecisions);
    }
    if (shouldLogDecision) {
      if (self.config.debugMode) {
        console.log("Will log decision when user sees it");
        console.log(loggedDecision);
      }
      self.addDecisionHandler(context, loggedDecision, experimentId);
    }
    return response;
  }).catch(e => {
    return setErrorRecs(e);
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
  this.asyncPostRequest(this.banditLogDecisionEndpoint, headers, {
    id: decisionResponse.id,
    context: context,
    decision: decision,
    experimentId: experimentId,
    mdpId: this.getSessionId(),
    variantId: decision.variantId
  }).then(response => {
    if (this.config.debugMode) {
      console.log('Successfully logged decision');
      console.log(response);
    }
    this.updateLastDecision(decision, experimentId);
    return response;
  }).catch(e => {
    console.error(e);
  });
};

BanditAPI.prototype.isDelayedReward = function(reward, experimentId) {
  const lastDecision = this.getLastDecision(experimentId);
  if (lastDecision == null) {
    // last decision wasn't populated, so it shouldn't be possible reward is delayed
    return false;
  }
  // if every key is in the possible choices (IDs), we categorize as delayed reward
  return Object.keys(reward).every(key => lastDecision.ids.includes(key));
};

BanditAPI.prototype.logReward = function(reward, experimentId, decision = null, decisionId = null) {
  const headers = {
    "Authorization": `ApiKey ${this.banditApikey}`
  };
  this.assert(
    reward && typeof reward === "object", "Reward needs to be a non-empty object.");
  if (this.isDelayedReward(reward, experimentId)) {
    this.assert(decision === null, `decision needs to be null for delayed rewards.`);
    this.assert(decisionId === null, `decisionId needs to be null for delayed rewards.`);
  } else {
    this.assert(decision && typeof decision === "string", `For immediate rewards, decision needs to be a single string ID. Got ${decision} instead.`);
    this.assert(decisionId && typeof decisionId === "string", `For immediate rewards, decisionId needs to be a single string ID. Got ${decisionId} instead.`);
  }
  this.asyncPostRequest(this.banditLogRewardEndpoint, headers, {
    decisionId: decisionId,
    decision: decision,
    metrics: reward,
    experimentId: experimentId,
    mdpId: this.getSessionId()
  }).then(response => {
    if (this.config.debugMode) {
      console.log("Successfully logged reward.");
      console.log(response);
    }
    if (decisionId === null) {
      // TODO: edge case - do we clear session in case of failures too?
      this.clearSession();
    }
    return response;
  }).catch(e => {
    console.error(e);
  })
};
