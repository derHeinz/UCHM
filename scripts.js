var analyzer = null
var nodeNetwork = null

function outage() {
    // shopping cart down:
    const outId = 504;
    var outIds = analyzer.affectedNodes(outId);
    const affected = [outId, ...outIds];
    nodeNetwork.unhealthy(affected);
}
function backNormal() {
    const outId = 504;
    var outIds = analyzer.affectedNodes(outId);
    const affected = [outId, ...outIds];
    nodeNetwork.healthy(affected);
}

// initiate
analyzer = new Analyzer(nodes, edges);
console.log(nodes);
nodeNetwork = new NodeNetwork(nodes, edges, document.getElementById("mynetwork"));
