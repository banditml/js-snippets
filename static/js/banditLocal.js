// 16ounc.es
// let experimentId = "01c14c21-b66a-408b-89ba-7d888f0c35de";
// let bandit = new banditml.BanditAPI("a48853ba-6c5a-3202-8711-4ce878833cb3", {[experimentId]: "recs"}, {debugMode: true, banditHostUrl: "https://www.16ounc.es/api/"});
// local
// product set case
let experimentId = "fce763c5-eaf6-4b4d-ae42-47d62ecf04ab";
// product set multi-dynamic case
// let experimentId = "7703f35c-f0a5-42a3-b0d9-d29c3952bd97";
// category case
// let experimentId = "59204365-5e27-4c8c-a21b-e1a81d373979";
function getSessionIdCustom () {
  return "1235"
}
let bandit = new banditml.BanditAPI("c52e1439-77bc-3cfd-b422-6a4d9a1e2c8c", {[experimentId]: "recsCategory"}, {debugMode: true, debugOptions: {}, banditHostUrl: "http://localhost:8000/api/", getSessionId: getSessionIdCustom});
