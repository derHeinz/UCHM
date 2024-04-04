


class NodeNetwork {

    dataToJsgaTranslation = new Map()
    jsgaGraph = null // js-graph-algorithms instance
    network = null // vis network instance

    nodes = []
    parentNodes = []
    edges = []

    container = null

    constructor(nodes, parentNodes, edges, container) {
        this.nodes = nodes;
        this.parentNodes = parentNodes;
        this.allNodes = nodes.concat(parentNodes);
        this.edges = edges;
        this.container = container;
        this.createJsgaGraph();
        this.initializeVisNetwork();
        this.initEventListeners();
        console.log("NodeNetwork constructed")
    }

    createJsgaGraph() {
        // assign the js-graph-algorithms id to them nodes and build mapping
        var count = 0
        this.nodes.forEach(n => {
            n.jsgaId = count;
            this.dataToJsgaTranslation.set(n.id, n.jsgaId);
            count++;
        });
        // TODO im not clear whether this is a good idea!
        this.parentNodes.forEach(n => {
            n.jsgaId = count;
            this.dataToJsgaTranslation.set(n.id, n.jsgaId);
            count++;
        })

        // build js-graph-algorithm graph
        this.jsgaGraph = new jsgraphs.DiGraph(count);
        this.edges.forEach(e => {
            var jsgaFrom = this.dataToJsgaTranslation.get(e.from);
            var jsgaTo = this.dataToJsgaTranslation.get(e.to);
            this.jsgaGraph.addEdge(jsgaFrom, jsgaTo);
        })
    }

    // defines styling for nodes
    styleNodes(arrayOfNodes) {
        arrayOfNodes.forEach(e => {
            if (e.payload.type) {
                e.group = e.payload.type + "s";
            }
        });
    }

    styleEdges(arrayOfEdges) {
        arrayOfEdges.forEach(e => {
            e.color = "black";
            e.width = 1;
        });
    }

    incomingEdges(nodeId) {
        var count = 0;
        this.edges.forEach(e => {
            if (e.to === nodeId) {
                count++;
            }
        });
        return count;
    }
    outgoingEdges(nodeId) {
        var count = 0;
        this.edges.forEach(e => {
            if (e.from === nodeId) {
                count++;
            }
        });
        return count;
    }
    numberOfChildren(nodeId) {
        var count = 0;
        // for now only the direct children
        this.nodes.forEach(n => {
            if (n.parent == nodeId) {
                count++;
            }
        });
        return count;
    }

    toVisJSNode(nodeData) {
        var children = this.numberOfChildren(nodeData.id);
        var labelContent = nodeData.name;
        if (children) {
            labelContent = labelContent + '\nChildren: (' + children + ')';
        }
        
        return {
            id: nodeData.id,
            payload: nodeData,
            label: labelContent
        }
    }

    initializeVisNetwork() {

        var self = this;
        var visJsNodes = this.nodes.map(n => self.toVisJSNode(n));
        console.log(visJsNodes);
        var visJsParentNodes = this.parentNodes.map(n => self.toVisJSNode(n));
        
        // add styling based information to the data
        this.styleNodes(visJsNodes);
        this.styleNodes(visJsParentNodes);
        //this.styleEdges(this.edges);
        var data = {
            nodes: visJsNodes,
            edges: this.edges,
        };
        var svg ='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">'
        + '<circle cx="100" cy="100" r="100" stroke="black" stroke-width="5" fill="red" />'
        + '</svg>';

        var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        var options = {
            nodes: {
                shadow: true,
                font: { size: 30 }
            },
            edges: {
                color: "grey",
                width: 1
            },
            groups: {
                features: {
                    color: { background: "lightgrey", border: "yellow" },
                    shape: "ellipse",
                    image: url
                },
                services: {
                    color: { background: "lightgrey", border: "blue" },
                    shape: "box"
                }
            },
            layout: {
                hierarchical: {
                    sortMethod: "directed",
                    shakeTowards: "roots",
                    direction: 'UD'
                },
            },
            physics: {
                hierarchicalRepulsion: {
                    avoidOverlap: 8,
                },
            },
        };
        this.network = new vis.Network(this.container, data, options);
    }
    initEventListeners() {
        self = this
        this.network.on("doubleClick", function (params) {
            if (params.nodes.length == 1) {
                if (self.network.isCluster(params.nodes[0]) == true) {
                    self.network.openCluster(params.nodes[0]);
                }
            }
        });
        
        // deactivate default contextmenu
        this.container.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        }, false);
        this.network.on("oncontext", function (params) {
            var x_hit = params.pointer.DOM.x
            var y_hit = params.pointer.DOM.y
           
            var nodeData = self.findNodeByCoordinates(x_hit, y_hit)
            
            if (!nodeData) {
                console.log('could not locate node by coordinates.');
                return
            }

            console.log(nodeData);

            var parentNodeId = nodeData.parent
            if (!parentNodeId) {
                console.log('hit a node with no parent');
                return
            }
            console.log('clustering all nodes with parent: ' + parentNodeId)
            var parentNodeProperties = parentNodes.filter((n) => (n.id === parentNodeId))[0]
            if (!parentNodeProperties) {
                console.log('could not find the parent node for ' + parentNodeId);
                return
            }
            var visJsParentNodeProperties = self.toVisJSNode(parentNodeProperties);
        
            var clusterOptions = {
                joinCondition: function (childOptions) {
                    return childOptions?.payload?.parent === parentNodeId
                },
                clusterNodeProperties: visJsParentNodeProperties
                
            }
            self.network.cluster(clusterOptions);
        });
        console.log('event listeners installed');
    }

    findNodeByCoordinates(x_hit, y_hit) {
        var nodeid = this.network.getNodeAt({x: x_hit, y: y_hit})
        console.log('hit node ' + nodeid)
    
        if (!nodeid) {
            console.log('failed to hit a node')
            return
        }
        return this.findNodeById(nodeid);
    }
    findNodeById(id) {
        var simpleNode = this.nodes.filter((n) => (n.id === id))[0]
        if (simpleNode) {
            return simpleNode;
        }
        var parentNode = this.parentNodes.filter((n) => (n.id === id))[0]
        if (parentNode) {
            return parentNode;
        }
        return undefined;
    }

    recalculateHealthStyle() {
        this.allNodes.forEach(n => {
            if (n.payload.health) {
                n.color = { background: "green"};
            } else {
                n.color = { background: "red"};
            }
        });
    }


}