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

function getTextFromTextInput() {
    return document.getElementById("searchText").value;
}

function outage() {
    const nodeId = getNodeIdFromInput();
    healthController.changeState(nodeId, false);
}
function backNormal() {
    const nodeId = getNodeIdFromInput();
    healthController.changeState(nodeId, true);
}
function hide(type) {
    var txt = getTextFromTextInput();
    var filteredNodeIds = nodes.filter(n => {
        return n.type === type && n.name.includes(txt);
    }).map(n => n.id);
    nodeNetwork.filterNodesNeighborhood(filteredNodeIds);
}
function unhide() {
    nodeNetwork.filterNodesNeighborhood(nodes.map(n => n.id));
}

init();