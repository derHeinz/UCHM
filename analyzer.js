/**
 * This class enriches the data (especially nodes) with graph-related information.
 */
class Analyzer {

    dependencyGraph = null;
    parentalGraph = null;

    nodes = [];
    edges = [];

    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this._analyze();
        console.log("Nodes analyzed")
    }

    _findNodeById(nodeId) {
        return this.nodes.filter((n) => (n.id === nodeId))[0];
    }

    _analyze() {
        const self = this;

        this.dependencyGraph = this._createDependencyGraph();
        this.parentalGraph = this._createParentalGraph();
        
        // some static data
        this.nodes.forEach(n => {
            n.outgoingEdgesCount = self._outgoingEdges(n.id);
            n.incomingEdgesCount = self._incomingEdges(n.id);
        })
        // children & parent info
        this.nodes.forEach(n => {
            n.children = self._children(n.id);
        })
        this.nodes.forEach(n => {
            n.isParent = n.children.length?true:false;
        })
        this.nodes.forEach(n => {
            n.childrenLeaves = self._childrenLeaves(n.id);
        })
    }

    _createDependencyGraph() {
        var g = new graphlib.Graph({ directed: true, compound: false, multigraph: false });

        this.nodes.forEach(n => {
            g.setNode(n.id.toString());
        });
        // dependecy node edges 
        this.edges.forEach(e => {
            g.setEdge(e.from.toString(), e.to.toString());
        })
        return g;
    }
    _createParentalGraph() {
        var g = new graphlib.Graph({ directed: true, compound: false, multigraph: false });

        this.nodes.forEach(n => {
            g.setNode(n.id.toString());
        });
        // parental information transformed into edges
        this.nodes.forEach(n => {
            if (n.parent) {
                g.setEdge(n.id.toString(), n.parent.toString());
            }
        });

        return g;
    }

    _allPredecessors(nodeId, graph) {
        const self = this;

        const direct = graph.predecessors(nodeId.toString());
        const all = [...direct];
        direct.forEach(c => {
            all.push(...self._allPredecessors(c, graph));
        })
        return all.map(n => (parseInt(n)));
    }
    _allSuccessors(nodeId, graph) {
        const self = this;

        const direct = graph.successors(nodeId.toString());
        const all = [...direct];
        direct.forEach(c => {
            all.push(...self._allSuccessors(c, graph));
        })
        return all.map(n => (parseInt(n)));
    }

    _children(nodeId) {
        return this._allPredecessors(nodeId, this.parentalGraph);
    }

    _childrenLeaves(nodeId) {
        var self = this;
        var node = this._findNodeById(nodeId);
        return node.children.filter(cnId => {
            var cn = self._findNodeById(cnId);
            return !cn.isParent;
        });
    }

    _incomingEdges(nodeId) {
        var count = 0;
        this.edges.forEach(e => {
            if (e.to === nodeId) {
                count = count+1;
            }
        });
        return count;
    }
    _outgoingEdges(nodeId) {
        var count = 0;
        this.edges.forEach(e => {
            if (e.from === nodeId) {
                count = count+1;
            }
        });
        return count;
    }

    /**
     * Returns all directly and indirectly referenced nodes. Including parents!
     */
    affectedNodes(nodeId) {
        const dependencyPredecessors = this._allPredecessors(nodeId, this.dependencyGraph);
        var allParental = this._allSuccessors(nodeId, this.parentalGraph);
        dependencyPredecessors.forEach(n => {
            allParental.push(...this._allSuccessors(n, this.parentalGraph));
        });
 
        allParental = [...new Set(allParental)]; // unique list
        const result = dependencyPredecessors.concat(allParental);
        console.log("Affected nodes for node " + nodeId + " are " + result);
        return result;
    }

}