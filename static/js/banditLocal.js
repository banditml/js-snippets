let experimentId = "84a8cc7a-9156-41fb-af9d-8001c8e1897b";
let bandit = new banditml.BanditAPI(
  apiKey = "6bd9ba8f-bd71-3139-a6e5-41275f34afe9",
  recClassByExperimentId = {[experimentId]: "product-recs"},
  config = {
    debugMode: true,
    banditHostUrl: "http://localhost:8000/api/",
    debugOptions: {forceVariantSlug: "bandit"}
  }
);
