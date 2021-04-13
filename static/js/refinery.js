window.refinery = window.refinery || {};

refinery.RefineryAPI = function (config = {}) {
  this.storage = window.localStorage;
  this.refineryApikey = this.getApiKeyFromScriptTag();

  let defaultConfig = {
    debugMode: false,
    refineryHostUrl: "https://app.banditml.com/api/v2",
  };
  this.config = Object.assign(defaultConfig, config);

  this.refineryLiveRefinementEndpoint = `${this.config.refineryHostUrl}changesets`;
};

refinery.RefineryAPI.prototype.getApiKeyFromScriptTag = function () {
  return document.currentScript.getAttribute('apiKey');
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
      "x-chrome-installation": `${self.refineryApikey}`
    }
  );
  return changesPromise.then(response => {
    return response.results;
  }).catch(e => {
    console.error("Failed to fetch changes", e);
  });
};

refinery.RefineryAPI.prototype.applyChanges = function() {
  const self = this;
  self.getLiveRefinement().then(response => {
    // right now we assume 1 changeset only, so grab the first i.e. [0]
    let changes = response[0].changes;
    changes.forEach(change => {
      if (window.location.href === change.href) {
        let domPath = document.querySelector(change.domPath);
        if (domPath.innerHTML !== change.beforeHtml) {
          console.warn(`Can't apply change on '${change.beforeHtml}' because copy doesn't match.\
 '${change.beforeHtml}' vs. '${domPath.innerHTML}'.`);
        } else {
            domPath.innerHTML = change.afterHtml;
        }
      } else {
        console.warn(`
          Can't apply change on '${change.beforeHtml}' because href's don't match.\
 '${change.href}' vs. '${window.location.href}'.`);
      }
    });
  });

}

let refineryAPI = new refinery.RefineryAPI();
refineryAPI.applyChanges();
