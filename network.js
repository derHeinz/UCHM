class NodeNetwork {

    network = null // vis network instance

    nodes = []
    edges = []

    nodesDataSet = null // contains all vis js nodes, also those that are currently not displayed.   
    container = null

    constructor(nodes, edges, container) {
        this.nodes = nodes;
        this.edges = edges;
        this.container = container;
        this.initializeVisNetwork();
        this.initEventListeners();
        console.log("NodeNetwork constructed")
    }

    toVisJSNode(nodeData) {
        var labelContent = '(' + nodeData.id + ')\n' + nodeData.name;
        if (nodeData.children.length) {
            var headline = nodeData.type === 'feature'?'Features':'Services';
            labelContent = labelContent + '\n' + headline + ': (' + nodeData.children.length + ')';
        }

        // adding group information for styling
        var groupContent = 'none';
        if (nodeData.type) {
            groupContent = nodeData.type + "s"; // features or services
        }
        
        return {
            id: nodeData.id,
            payload: nodeData,
            group: groupContent,
            label: labelContent
        };
    }

    initializeVisNetwork() {

        var self = this;

        var visJsNodes = this.nodes.filter(n => {return !n.isParent}).map(n => self.toVisJSNode(n));
        this.nodesDataSet = new vis.DataSet(visJsNodes)
        
        var data = {
            nodes: this.nodesDataSet,
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
                    color: { border: "yellow", highlight: { border: "yellow" } },
                    shape: "ellipse",
                    //image: url
                },
                services: {
                    color: { border: "blue", highlighted: { border: "blue" } },
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

            var parentNodeId = nodeData.parent
            if (!parentNodeId) {
                console.log('hit a node with no parent');
                return
            }
            var parentNodeProperties = self.findNodeById(parentNodeId);
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
    }
    findNodeByCoordinates(x_hit, y_hit) {
        var nodeid = this.network.getNodeAt({x: x_hit, y: y_hit})
    
        if (!nodeid) {
            console.log('failed to hit a node')
            return
        }
        return this.findNodeById(nodeid);
    }
    findNodeById(id) {
        return this.nodes.filter((n) => (n.id === id))[0];
    }
    findVisJsNodeById(id) {
        return this.visJsNodes.filter((n) => (n.id === id))[0];
    }

    recalculateHealthStyle() {
        this.visJsNodes.forEach(n => {
            if (n.payload.health) {
                n.color = { background: "green", highlight: { background: "green" }};
            } else {
                n.color = { background: "red", highlight: { background: "red" }};
            }
        });
    }

    colorNode(nodeId, color) {
        this.nodesDataSet.updateOnly({id: nodeId, color: { background: color, highlight: { background: color }}});
    }
    healthy(listOfNodeIds) {
        var self = this;
        listOfNodeIds.forEach(n => {
            self.colorNode(n, "green");
        })
    }
    unhealthy(listOfNodeIds) {
        listOfNodeIds.forEach(n => {
            self.colorNode(n, "red");
        })
    }

}