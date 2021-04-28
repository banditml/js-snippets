window.refinery = window.refinery || {};

refinery.RefineryAPI = function (config = {}) {
  this.storage = window.localStorage;
  this.refineryAppToken = this.getAppTokenFromScriptTag();

  let defaultConfig = {
    debugMode: false,
    refineryHostUrl: "https://utvcbgmjyqoututafrjy.supabase.co/rest/v1/rpc/",
    supabasePublicApiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxODQxODU2NiwiZXhwIjoxOTMzOTk0NTY2fQ.uAM7wYbfMO8i8G5r-Mi7CFAS56ZEVicp4de6GJg_Gt0",
  };
  this.config = Object.assign(defaultConfig, config);

  this.refineryLiveRefinementEndpoint = `${this.config.refineryHostUrl}changes_by_app_token`;
};

refinery.RefineryAPI.prototype.setItemInStorage = function (key, obj) {
  this.storage.setItem(key, JSON.stringify(obj));
};

refinery.RefineryAPI.prototype.getItemFromStorage = function (key) {
  return JSON.parse(this.storage.getItem(key));
};

refinery.RefineryAPI.prototype.getAppTokenFromScriptTag = function () {
  return document.currentScript.getAttribute('appToken');
};

refinery.RefineryAPI.prototype.asyncGetRequest = async function (
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

refinery.RefineryAPI.prototype.getLiveRefinement = function () {
  const self = this;
  const changesPromise = self.asyncGetRequest(
    url = `${self.refineryLiveRefinementEndpoint}?app_token=${self.refineryAppToken}`,
    params = {},
    headers = {
      "Content-Type": "application/json",
      "apikey": `${self.config.supabasePublicApiKey}`,
      "Authorization": `Bearer ${self.config.supabasePublicApiKey}`
    }
  );
  return changesPromise.then(response => {
    return response;
  }).catch(e => {
    console.error("Failed to fetch changes", e);
  });
};

refinery.RefineryAPI.prototype.applyChange = function (change) {
  if (window.location.href === change.href) {
    let elem = document.querySelector(change.dom_path);
    if (elem.innerHTML.trim() !== change.before_html.trim()) {
      console.warn(`Can't apply change on '${change.before_html}' because copy doesn't match.\
'${change.before_html.trim()}' vs. '${elem.innerHTML.trim()}'.`);
    } else {
        elem.innerHTML = change.after_html;
        return true;
    }
  } else {
    console.warn(`
      Can't apply change on '${change.before_html}' because href's don't match.\
'${change.href}' vs. '${window.location.href}'.`);
  }
  return false;
};

refinery.RefineryAPI.prototype.cacheChanges = function (changes) {
  const self = this;
  self.setItemInStorage(self.refineryAppToken, changes)
};

refinery.RefineryAPI.prototype.applyChangesFromCache = function () {
  const self = this;
  const changes = this.getItemFromStorage(self.refineryAppToken) || [];
  const changesAppliedFromCache = new Set();
  changes.filter(change => !change.deleted).forEach(change => {
    const changeApplied = self.applyChange(change);
    if (changeApplied) changesAppliedFromCache.add(change.id);
  });
  return changesAppliedFromCache;
};

refinery.RefineryAPI.prototype.applyChangesFromProd = function (changesAppliedFromCache) {
  const self = this;
  const changesToCache = [];
  self.getLiveRefinement().then(response => {
    let changes = response;
    changes.filter(change => !change.deleted).forEach(change => {
      if (!(changesAppliedFromCache.has(change.id))) {
          // the change hasn't been applied from the cache so we must apply it
          // this works as long as we don't allow edits to changes (we currently don't)
          // once we do, then we will need to make a check if the change has changed -_-
          self.applyChange(change);
      }
      changesToCache.push(change);
    });
    self.cacheChanges(changesToCache);
  });
};

let refineryAPI = new refinery.RefineryAPI();
document.addEventListener('DOMContentLoaded', (event) => {
  const changesAppliedFromCache = refineryAPI.applyChangesFromCache();
  refineryAPI.applyChangesFromProd(changesAppliedFromCache);
})
