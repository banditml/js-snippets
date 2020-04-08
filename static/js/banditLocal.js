// 16ounc.es
// let experimentId = "0698873e-b157-4fcb-bac5-5c6e804ee4ba";
// let bandit = new BanditAPI("b3496e1b-228f-33fd-9887-883e8f15d7e1", {[experimentId]: "recs"}, debugMode = true);
// local
// product set case
// let experimentId = "6d1770d7-4e23-40e0-8b1c-2ff59b717755";
// let bandit = new BanditAPI("c52e1439-77bc-3cfd-b422-6a4d9a1e2c8c", {[experimentId]: "recs"}, {debugMode: true, autoLogReward: ["click"]});
// category case
let experimentId = "59204365-5e27-4c8c-a21b-e1a81d373979";
let bandit = new BanditAPI("c52e1439-77bc-3cfd-b422-6a4d9a1e2c8c", {[experimentId]: "recsCategory"}, {debugMode: true, banditHostUrl: "http://localhost:8000/api/"});
