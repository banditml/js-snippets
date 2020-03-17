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


function BanditAPI (apiKey, defaultExperimentId) {
  this.contextName = "banditMLContext";
  this.storage = window.localStorage;
  this.defaultExperimentId = defaultExperimentId;

  // bandit backend information
  this.banditApikey = apiKey;
  const banditHostUrl = "http://localhost:8000/api/";
  this.banditDecisionEndpoint = banditHostUrl + "decision";
  this.banditLogRewardEndpoint = `${banditHostUrl}reward`;
  this.banditLogDecisionEndpoint = `${banditHostUrl}log_decision`;

  // URLs & hosts
  this.ipUrl = "https://api.ipify.org?format=json";
}

BanditAPI.prototype.assert = function(condition, errString) {
  if (condition === false) {
    throw errString;
  }
};

BanditAPI.prototype.asyncGetRequest = async function(
  url,
  paramName = null,
  body = null,
  headersDict = {}
) {
  if (paramName != null && body != null) {
    const data = encodeURIComponent(JSON.stringify(body));
    url += `?${paramName}=` + data;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: headersDict
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

BanditAPI.prototype.getContext = function() {
  return JSON.parse(this.storage.getItem(this.contextName));
};

BanditAPI.prototype.setContext = function(dict) {
  this.storage.setItem(this.contextName, JSON.stringify(dict));
};

BanditAPI.prototype.clearContext = function() {
  this.storage.removeItem(this.contextName);
};

// TODO: merge with updateContextValue and just have one updateContext?
BanditAPI.prototype.updateContextList = function(newContext) {
  // for variable length features use this method
  // i.e. productsInCart = [12, 1, 54, ...];
  const self = this;
  Object.keys(newContext).forEach(function(key) {
    self.assert(
      Array.isArray(newContext[key]),
      `Key "${key}" is not an array.`
    )
  });

  let context = self.getContext();
  if (context == null) {
    context = newContext;
  } else {
    Object.keys(newContext).forEach(function(key) {
      if (key in context) {
        context[key].push(...newContext[key]);
      } else {
        context[key] = newContext[key];
      }
    });
  }
  self.setContext(context);
};

BanditAPI.prototype.updateContextValue = function(newContext) {
  // for typical features (not variable length) use this method
  // i.e. cartValue = 35.99;
  const self = this;
  let context = self.getContext();
  if (context == null) {
    context = newContext;
  } else {
    context = Object.assign({}, context, newContext);
  }
  self.setContext(context);
};

BanditAPI.prototype.getDecision = async function (
  experimentId = null,
  productRecs = null,
  filterRecs = null,
  populateProductRecs = null,
  shouldLogDecision = true
) {
  // set the IP address before making a decision and logging context
  let ipPromise = this.asyncGetRequest(this.ipUrl);
  ipPromise.then(response => {
    return response;
  }).then(data => {
    this.updateContextValue({ipAddress: data.ip})
  });

  // call gradient-app and get a decision
  // TODO: how to handle multiple experiments
  let context = this.getContext();
  context.experimentId = experimentId || this.defaultExperimentId;

  let decisionPromise = this.asyncGetRequest(
    url = this.banditDecisionEndpoint,
    paramName = "context",
    body = context,
    headers = {
      "Authorization": `ApiKey ${this.banditApikey}`
    }
  );

  return decisionPromise.then(async (response) => {
    let loggedDecision = response;
    let productRecIds;
    if (productRecs) {
      if (response.isControl) {
        // productRecs can be array of IDs
        if (Array.isArray(productRecs)) {
          productRecIds = productRecs;
        } else {
          // productRecs could also be a function that returns IDs or an async function that returns promise of IDs
          let result = productRecs();
          if (result && result.then) {
            // if fn returns a promise, we await it then expect ids to be returned
            productRecIds = await result;
          } else {
            productRecIds = result;
          }
        }
      } else {
        productRecIds = response.decision;
      }
    } else {
      productRecIds = response.decision;
    }
    if (filterRecs) {
      // filterRecs can be function that directly returns IDs or promise
      let result = filterRecs(productRecIds);
      if (result && result.then) {
        productRecIds = await result;
      }
    }
    loggedDecision.decision = productRecIds;
    if (populateProductRecs) {
      let result = populateProductRecs(productRecIds);
      if (result && result.then) {
        await result;
      }
    }
    if (shouldLogDecision) {
      this.logDecision(context, loggedDecision);
    }
    return response;
  }).catch(function(e) {
    console.error(e);
    return {"message": "Decision request failed."};
  });
};

BanditAPI.prototype.logDecision = function(context, decision) {
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
  this.asyncPostRequest(this.banditLogRewardEndpoint, headers, {
    decisionId: decisionId,
    reward: reward,
  }).then(response => {
    return response;
  });
};

// var bandit = new BanditAPI("0dc5dc79-95fc-3fa5-b141-9719983c32b0");
// var bandit = new BanditAPI("c52e1439-77bc-3cfd-b422-6a4d9a1e2c8c");