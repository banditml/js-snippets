window.refinery = window.refinery || {};

refinery.RefineryAPI = function (config = {}) {
  this.storage = window.localStorage;
  this.refineryAppToken = this.getAppTokenFromScriptTag();

  let defaultConfig = {
    debugMode: false,
    refineryHostUrl: "https://app.banditml.com/api/v2/",
  };
  this.config = Object.assign(defaultConfig, config);

  this.refineryLiveRefinementEndpoint = `${this.config.refineryHostUrl}changesets`;
};

refinery.RefineryAPI.prototype.getAppTokenFromScriptTag = function () {
  return document.currentScript.getAttribute('appToken');
};

refinery.RefineryAPI.prototype.asyncGetRequest = async function(
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

refinery.RefineryAPI.prototype.getLiveRefinement = function() {
  const self = this;
  const changesPromise = self.asyncGetRequest(
    url = self.refineryLiveRefinementEndpoint,
    params = {},
    headers = {
      "x-app-token": `${self.refineryAppToken}`
    }
  );
  return changesPromise.then(response => {
    return response.results;
  }).catch(e => {
    console.error("Failed to fetch changes", e);
  });
};

refinery.RefineryAPI.prototype.applyChange = function(change) {
  if (window.location.href === change.href) {
    let elem = document.querySelector(change.domPath);
    if (elem.innerHTML.trim() !== change.beforeHtml.trim()) {
      console.warn(`Can't apply change on '${change.beforeHtml}' because copy doesn't match.\
'${change.beforeHtml.trim()}' vs. '${elem.innerHTML.trim()}'.`);
    } else {
        console.log(change.afterHtml);
        elem.innerHTML = change.afterHtml;
    }
  } else {
    console.warn(`
      Can't apply change on '${change.beforeHtml}' because href's don't match.\
'${change.href}' vs. '${window.location.href}'.`);
  }
};

refinery.RefineryAPI.prototype.applyChanges = function() {
  const self = this;
  self.getLiveRefinement().then(response => {
    // right now we assume 1 changeset only, so grab the first i.e. [0]
    let changeset = response[0];
    let changes;
    (changeset.publish) ? changes = changeset.changes : changes = [];
    changes.filter(change => !change.deleted).forEach(change => {
      self.applyChange(change);

    });
  });
}

let refineryAPI = new refinery.RefineryAPI();
refineryAPI.applyChanges();