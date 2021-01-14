let experimentId = "4e3b296f-c9b3-4af6-a498-e6d9888aaf55";
let bandit = new banditml.BanditAPI(
  apiKey = "4be5e740e5d4ee99accc33b903cdb8e4",
  recClassByExperimentId = {[experimentId]: "product-recs"},
  config = {
    debugMode: false,
    banditHostUrl: "http://localhost:8000/api/",
    debugOptions: {forceVariantSlug: "tf"}
  }
);
