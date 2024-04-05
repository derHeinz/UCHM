var analyzer = null
var nodeNetwork = null

function outage() {
    // shopping cart down:
    const outId = 504;
    const outIds = analyzer.adj(outId);
    console.log(outIds);
    nodeNetwork.health(504, true);
    console.log('health changed');
}

// initiate
analyzer = new Analyzer(nodes, edges);
console.log(nodes);
nodeNetwork = new NodeNetwork(nodes, edges, document.getElementById("mynetwork"));
