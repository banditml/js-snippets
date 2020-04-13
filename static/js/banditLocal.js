// 16ounc.es
// let experimentId = "0698873e-b157-4fcb-bac5-5c6e804ee4ba";
// let bandit = new BanditAPI("b3496e1b-228f-33fd-9887-883e8f15d7e1", {[experimentId]: "recs"}, debugMode = true);
// local
// product set case
let experimentId = "18c08829-e49e-421f-a13b-77e7d6d0221b";
// category case
// let experimentId = "59204365-5e27-4c8c-a21b-e1a81d373979";
function getSessionIdCustom () {
  return "1235"
}
let bandit = new BanditAPI("c52e1439-77bc-3cfd-b422-6a4d9a1e2c8c", {[experimentId]: "recsCategory"}, {debugMode: true, banditHostUrl: "http://localhost:8000/api/", getSessionId: getSessionIdCustom});
