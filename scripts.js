var analyzer = null;
var nodeNetwork = null;
var healthController = null;

var lastOutageNodeId = null;

function init() {
    // initiate
    analyzer = new Analyzer(nodes, edges);
    console.log(nodes);
    nodeNetwork = new NodeNetwork(nodes, edges, document.getElementById("mynetwork"));
    healthController = new HealthController(nodes, analyzer, nodeNetwork);
    healthController.initialState();
}

function getNodeIdFromInput() {
    const val = document.getElementById("nodeId").value;
    return parseInt(val);
}

function outage() {
    const nodeId = getNodeIdFromInput();
    healthController.changeState(nodeId, false);
}
function backNormal() {
    const nodeId = getNodeIdFromInput();
    healthController.changeState(nodeId, true);
}

init();