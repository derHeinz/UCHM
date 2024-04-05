/**
 * This class enriches the data (especially nodes) with graph-related information.
 */
class Analyzer {

    dataToJsgaTranslation = new Map()
    jsgaToDataTranslation = new Map()
    jsgaGraph = null // js-graph-algorithms instance

    graphlibGraph = null

    nodes = []
    nodeIdsInTopologicalOrder = []
    edges = []

    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.analyze();
        console.log("Nodes analyzed")
    }

    findNodeById(nodeId) {
        return this.nodes.filter((n) => (n.id === nodeId))[0];
    }

    analyze() {
        var self = this;

        this.jsgaGraph = this.createJsgaGraph();
        this.nodeIdsInTopologicalOrder = this.calculateTopologicalOrder();

        this.graphlibGraph = this.createGraphlibGraph()
        
        // some static data
        this.nodes.forEach(n => {
            n.outgoingEdgesCount = self.outgoingEdges(n.id);
            n.incomingEdgesCount = self.incomingEdges(n.id);
        })
        // children & parent info
        this.nodes.forEach(n => {
            n.children = self.children(n.id);
        })
        this.nodes.forEach(n => {
            n.isParent = n.children.length?true:false;
        })
        this.nodes.forEach(n => {
            n.childrenLeaves = self.childrenLeaves(n.id);
        })
    }

    calculateTopologicalOrder() {
        var self = this;
        var ts = new jsgraphs.TopologicalSort(this.jsgaGraph);
        var order = ts.order();
        return order.map(e => (self.jsgaToDataTranslation.get(e)));
    }

    createJsgaGraph() {
        // assign the js-graph-algorithms id to them nodes and build mapping
        var count = 0
        this.nodes.forEach(n => {
            n.jsgaId = count;
            this.dataToJsgaTranslation.set(n.id, n.jsgaId);
            this.jsgaToDataTranslation.set(n.jsgaId, n.id);
            count++;
        });

        // build js-graph-algorithm graph
        var jsgaGraph = new jsgraphs.DiGraph(count);
        this.edges.forEach(e => {
            var jsgaFrom = this.dataToJsgaTranslation.get(e.from);
            var jsgaTo = this.dataToJsgaTranslation.get(e.to);
            jsgaGraph.addEdge(jsgaFrom, jsgaTo);
        })
        return jsgaGraph;
    }

    createGraphlibGraph() {
        var g = new graphlib.Graph();

        this.nodes.forEach(n => {
            g.setNode(n.id.toString());
        });

        // build js-graph-algorithm graph
        
        this.edges.forEach(e => {
            g.setEdge(e.from.toString(), e.to.toString());
        })
        return g;
    }

    children(nodeId) {
        var self = this;
        var nodeIdsInOrderCopy = JSON.parse(JSON.stringify(this.nodeIdsInTopologicalOrder));

        var listOfAncesterNodeIds = [];
        listOfAncesterNodeIds.push(nodeId);

        // after this all children are in the list of ancestors
        nodeIdsInOrderCopy.forEach(nId => {
            var node = self.findNodeById(nId);

            for (let i = 0; i < listOfAncesterNodeIds.length; i++) {
                var ancestorId = listOfAncesterNodeIds[i];
                if (node.parent === ancestorId) { // someone who's parent you are
                    listOfAncesterNodeIds.push(node.id);
                    break;
                }
            }
        });
        listOfAncesterNodeIds.shift()
        return listOfAncesterNodeIds;
    }

    childrenLeaves(nodeId) {
        var self = this;
        var node = this.findNodeById(nodeId);
        return node.children.filter(cnId => {
            var cn = self.findNodeById(cnId);
            return !cn.isParent;
        });
    }

    incomingEdges(nodeId) {
        var count = 0;
        this.edges.forEach(e => {
            if (e.to === nodeId) {
                count = count+1;
            }
        });
        return count;
    }
    outgoingEdges(nodeId) {
        var count = 0;
        this.edges.forEach(e => {
            if (e.from === nodeId) {
                count = count+1;
            }
        });
        return count;
    }

    /**
     * Returns all directyl and indirectly referenced nodes.
     */
    affectedNodes(nodeId) {
        var affectedNodesString = this.graphlibGraph.predecessors(nodeId.toString());
        return affectedNodesString.map(n => (parseInt(n)));
    }

}