// 16ounc.es
// let experimentId = "01c14c21-b66a-408b-89ba-7d888f0c35de";
// let bandit = new banditml.BanditAPI("a48853ba-6c5a-3202-8711-4ce878833cb3", {[experimentId]: "recs"}, {debugMode: true, banditHostUrl: "https://www.16ounc.es/api/"});
// local
// product set case
// let experimentId = "18c08829-e49e-421f-a13b-77e7d6d0221b";
// product set multi-dynamic case
let experimentId = "701c214c-14ed-4fc2-828c-452d61c2b670";
// category case
// let experimentId = "59204365-5e27-4c8c-a21b-e1a81d373979";
function getSessionIdCustom () {
  return "1235"
}
let bandit = new banditml.BanditAPI("c52e1439-77bc-3cfd-b422-6a4d9a1e2c8c", {[experimentId]: "recsCategory"}, {debugMode: true, banditHostUrl: "http://localhost:8000/api/", getSessionId: getSessionIdCustom});
