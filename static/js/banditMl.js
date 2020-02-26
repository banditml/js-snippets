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


function BanditAPI () {
  this.contextName = "banditMLContext";
  this.ipUrl = "https://api.ipify.org?format=json";
  this.storage = window.localStorage;
}

BanditAPI.prototype.assert = function(condition, errString) {
  if (condition == false) {
    throw errString;
  }
}

BanditAPI.prototype.asyncGetRequest = function(url) {
  return fetch(url, {method: 'GET'});
}

BanditAPI.prototype.getContext = function() {
    return JSON.parse(this.storage.getItem(this.contextName));
}

BanditAPI.prototype.setContext = function(dict) {
    this.storage.setItem(this.contextName, JSON.stringify(dict));
}

BanditAPI.prototype.clearContext = function() {
    this.storage.removeItem(this.contextName);
}

BanditAPI.prototype.updateContextList = function(newContext) {
    // for variable length features use this method
    // i.e. productsInCart = [12, 1, 54, ...];
    var self = this;
    Object.keys(newContext).forEach(function(key) {
      self.assert(
        Array.isArray(newContext[key]),
        `Key "${key}" is not an array.`
      )
    });

    var context = self.getContext();
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
}

BanditAPI.prototype.updateContextValue = function(newContext) {
    // for typical features (not variable length) use this method
    // i.e. cartValue = 35.99;
    var self = this;
    var context = self.getContext();
    if (context == null) {
      context = newContext;
    } else {
      context = Object.assign({}, context, newContext);
    }
    self.setContext(context);
}

BanditAPI.prototype.getDecision = function(experimentId) {
    // set the IP address before making a decision and logging context
    var ipPromise = this.asyncGetRequest(this.ipUrl);
    ipPromise.then(response => {
      return response.json();
    }).then(data => {
      this.updateContextValue({ip: data.ip})
    });

    // call gradient-app and get a decision
    // how to know which experiment?
    var context = this.getContext();

    // clear/reset the context since the decision has been made?
    // this should probably on clear the context relevant to
    // the current experiment (not all the shared context)
    // maybe do this with experiment ID's throughout
    this.clearContext()

    return {
      id: "abc123", // to join reward on
      decision: [
        "VPN",
        "Easy WP",
        "SSL"
      ]
    }
}

BanditAPI.prototype.logReward = function(decisionId, reward) {
  // make ajax? call to gradient-app
  console.log(this.getContext(), decisionId, reward);
}

var bandit = new BanditAPI()
