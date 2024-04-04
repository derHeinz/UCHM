

function nodesHealth(arrayOfNodes) {
    arrayOfNodes.forEach(e => {
        e.health = 1;
    });
}

function analyse(arrayOfAllNodes, arrayOfEdges) {
    // for each node calculate the amount of children (inlcuding grandchildren and thelike) -> as a base for the color
    var sortedArrayOfAllNodes = arrayOfAllNodes.sort((a,b) => {
        if (a.id > b.id) {
            return 1;
        } else if (a.id < b.id) {
            return -1;
        }
        return 0;
    })

    sortedArrayOfAllNodes.forEach(n => {
        var edges = arrayOfEdges.filter((e) => (e.from === n.id))
        var edgeEndNodes = edges.map((e) => {
            return findAnyNode(e.to)
        })
        edgeEndNodes.forEach(een => {
            if (een.payload.children) {
                een.payload.children = een.payload.children + 1;
            } else {
                een.payload.children = 1;
            }
        })
    });
}

function outage() {
    // shopping cart down:
    outageNodeid = 504

    return nodes.filter((n) => (n.id === nodeid))[0]
}

function init() {
    // initiate
    var container = document.getElementById("mynetwork");
    nodesHealth(nodes);
    nodesHealth(parentNodes);
    n = new NodeNetwork(nodes, parentNodes, edges, container);
}




//analyse(nodes, edges);
init();
