var analyzer = null;
var nodeNetwork = null;

var lastOutageNodeId = null;

function outage() {
    var services = nodes.filter(n => (n.type === 'service' && !n.isParent));
    var randomItem = services[Math.floor(Math.random()*services.length)];

    const outId = randomItem.id;
    var outIds = analyzer.affectedNodes(outId);
    const affected = [outId, ...outIds];
    nodeNetwork.unhealthy(affected);
    lastOutageNodeId = outId;
}
function backNormal() {
    const outId = lastOutageNodeId;
    var outIds = analyzer.affectedNodes(outId);
    const affected = [outId, ...outIds];
    nodeNetwork.healthy(affected);
}

// initiate
analyzer = new Analyzer(nodes, edges);
console.log(nodes);
nodeNetwork = new NodeNetwork(nodes, edges, document.getElementById("mynetwork"));
var listOfAllNodes = nodes.filter(n => !n.isParent).map(n => n.id);
nodeNetwork.healthy(listOfAllNodes);