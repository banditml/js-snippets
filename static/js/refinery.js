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

refinery.RefineryAPI.prototype.applyChange = function (change, element) {
  if (!(window.location.href === change.href)) {
    console.warn(`
      Can't apply change on '${change.before_html}' because href's don't match.\
'${change.href}' vs. '${window.location.href}'.`);
    return false;
  }

  let elem = element || document.querySelector(change.dom_path);
  if (elem.innerHTML.trim() !== change.before_html.trim()) {
    console.warn(`Can't apply change on '${change.before_html}' because copy doesn't match.\
'${change.before_html.trim()}' vs. '${elem.innerHTML.trim()}'.`);
  } else {
    elem.innerHTML = change.after_html;
    return true;
  }
  return false;
};

refinery.RefineryAPI.prototype.cacheChanges = function (changes) {
  const self = this;
  self.setItemInStorage(self.refineryAppToken, changes)
};

refinery.RefineryAPI.prototype.getChangesFromProd = function () {
  const self = this;
  return self.getLiveRefinement().then(response => {
    return response.filter(change => !change.deleted);
  });
};

refinery.RefineryAPI.prototype.applyChangesToMutations = function (mutationsList, changes, changesApplied) {
  const self = this;
  changesApplied = changesApplied || new Set();
  mutationsList.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        changes.forEach((change) => {
          let matchingElement = node.querySelector(change.dom_path);
          if (matchingElement) {
            if (!(changesApplied.has(change.id))) {
              const changeApplied = self.applyChange(change, matchingElement);
              if (changeApplied) changesApplied.add(change.id)
            }
          }
        })
      })
    }
  })
  return changesApplied;
};

let refineryAPI = new refinery.RefineryAPI();

const actOnBodyMutation = (mutationsList) => {
  // first apply cached changes
  const cachedChanges = refineryAPI.getItemFromStorage(refineryAPI.refineryAppToken) || [];
  const changesApplied = refineryAPI.applyChangesToMutations(mutationsList, cachedChanges);
  // then apply changes from production
  refineryAPI.getChangesFromProd().then(prodChanges => {
    refineryAPI.applyChangesToMutations(mutationsList, prodChanges, changesApplied);
    refineryAPI.cacheChanges(prodChanges);
  });
}

document.addEventListener('DOMContentLoaded', (event) => {
  const bodyObserver = new MutationObserver(actOnBodyMutation)
  bodyObserver.observe(document.body, { childList: true, subtree: true })
})
