class NodeNetwork {

    network = null; // vis network instance

    nodes = [];
    edges = [];

    nodesDataSet = null; // contains all vis js nodes, also those that are currently not displayed.   
    container = null;

    highlightActive = false; // whether or not a single node is selected.

    healthyNodeIds = [];
    unhealthyNodeIds = [];

    constructor(nodes, edges, container) {
        this.nodes = nodes;
        this.edges = edges;
        this.container = container;

        this._initializeVisNetwork();
        this._initEventListeners();
        console.log("NodeNetwork constructed")
    }

    _toVisJSNode(nodeData) {
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

    _getParentNodeVisJsProperties(parentNodeId) {
        var parentNodeProperties = self._findNodeById(parentNodeId);
        if (!parentNodeProperties) {
            return undefined;
        }
        var visJsParentNodeProperties = self._toVisJSNode(parentNodeProperties);
        // mixin the current state's properties
        if (self.unhealthyNodeIds.includes(parentNodeId)) {
            return {...visJsParentNodeProperties, ...self._propertiesUnhealthy()};
        } else if (self.healthyNodeIds.includes(parentNodeId)) {
            return {...visJsParentNodeProperties, ...self._propertiesHealthy()};
        }
        return undefined;
    }

    _highlightNode(nodeData) {
        nodeData.color.border = "grey";
    };

    _unhighlightNode(nodeData) {
        nodeData.color.border = "blue";
    }

    _initializeVisNetwork() {
        var self = this;

        var visJsNodes = this.nodes.filter(n => {return !n.isParent}).map(n => self._toVisJSNode(n));
        this.nodesDataSet = new vis.DataSet(visJsNodes)
        
        var data = {
            nodes: this.nodesDataSet,
            edges: this.edges,
        };
        var svg ='<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="400">'
        + '<circle cx="100" cy="500" r="400" stroke="black" stroke-width="5" fill="red" />'
        + '<text x="20" y="35" class="small">My</text>'
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
                    borderWidth: 4,
                    shape: "ellipse",
                    //image: url
                },
                services: {
                    borderWidth: 4,
                    shape: "box"
                }
            },
            layout: {
                hierarchical: {
                    enabled: true,
                    sortMethod: "directed",
                    shakeTowards: "roots",
                    direction: 'UD',
                    nodeSpacing: 320,
                    treeSpacing: 4000,
                    levelSeparation: 300,
                },
            },
            interaction: {
                hover: true
            },
            physics: {
                enabled: false,
            //    hierarchicalRepulsion: {
            //        avoidOverlap: 8,
           //         nodeDistance: 140
            //    },
            //    stabilization: {
            //        enabled: true,
            //        iterations: 10
            //    }
            //    barnesHut: {
            //        springConstant: 0,
            //        avoidOverlap: 0.8
            //    }
            },
        };
        this.network = new vis.Network(this.container, data, options);
    }

    _showNodesNeighborhood(selectedNodeId) {
        // get a JSON object
        self.network.storePositions();
        var simpleNodes = self.nodesDataSet.get({ returnType: "Object" });
        var simpleNodeIds = Object.keys(simpleNodes);

        var visibleClusterNodeIds = self.nodes
            .filter((n) => (n.isParent)) // only parents
            .map((n) => (n.id)) // their id's
            .filter((nId) => {return self.network.findNode(nId).length}) // only visible
            .filter((nId) => {return self.network.isCluster(nId)}); // only clusters
        var visibleClusterNodes = {}
        visibleClusterNodeIds.forEach((nId) => {
            visibleClusterNodes[nId] = self._getParentNodeVisJsProperties(nId);
        })

        var allNodeIds = simpleNodeIds.concat(visibleClusterNodeIds) // add cluster nodes

        function getPropertiesForNodeId(nodeId) {
            if (visibleClusterNodeIds.includes(nodeId)) {
                return visibleClusterNodes[nodeId];
            } else {
                return simpleNodes[nodeId];
            }
            return undefined;
        }

        var i;
        // if something is selected:
        if (selectedNodeId) {
            self.highlightActive = true;

            //  all nodes as hard to read.
            for (i = 0; i < allNodeIds.length; i++) {
                var nodeId = allNodeIds[i];
                var nodeProps = getPropertiesForNodeId(nodeId);
                self._highlightNode(nodeProps);
            }
            var connectedNodes = self.network.getConnectedNodes(selectedNodeId);
            // all first degree nodes get their own color and their label back
            for (i = 0; i < connectedNodes.length; i++) {
                var nodeProps = getPropertiesForNodeId(connectedNodes[i]);
                self._unhighlightNode(nodeProps);
            }

            // the main node gets its own color and its label back.
            var nodeProps = getPropertiesForNodeId(selectedNodeId);
            self._unhighlightNode(nodeProps);
        } else if (self.highlightActive === true) {
            // reset all nodes
            for (i = 0; i < allNodeIds.length; i++) {
                var nodeId = allNodeIds[i];
                var nodeProps = getPropertiesForNodeId(nodeId);
                self._unhighlightNode(nodeProps);
            }
            self.highlightActive = false;
        }

        // update simpleNodes
        var updateArray = [];
        for (nodeId in simpleNodes) {
            if (simpleNodes.hasOwnProperty(nodeId)) {
                updateArray.push(simpleNodes[nodeId]);
            }
        }
        self.nodesDataSet.update(updateArray);
        // update clusterNodes
        for (nodeId in visibleClusterNodes) {
            self.network.updateClusteredNode(nodeId, visibleClusterNodes[nodeId]);
        }
    }

    _initEventListeners() {
        self = this

        // cluster on double click
        this.network.on("doubleClick", function (params) {
            if (params.nodes.length == 1) {
                if (self.network.isCluster(params.nodes[0]) == true) {
                    self.network.openCluster(params.nodes[0]);
                }
            }
        });

        // highlight neighbourhood on hover
        this.network.on("hoverNode", function (params) {
            self._showNodesNeighborhood(params.node);
        });
        this.network.on("blurNode", function (params) {
            self._showNodesNeighborhood(undefined);
        });
        
        // deactivate default contextmenu
        this.container.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        }, false);
        // uncluster on right mouse click
        this.network.on("oncontext", function (params) {
            var x_hit = params.pointer.DOM.x
            var y_hit = params.pointer.DOM.y
           
            var nodeData = self._findNodeByCoordinates(x_hit, y_hit)
            
            if (!nodeData) {
                console.log('could not locate node by coordinates.');
                return
            }

            var parentNodeId = nodeData.parent
            if (!parentNodeId) {
                console.log('hit a node with no parent');
                return
            }
            var visJsParentNodeProperties = self._getParentNodeVisJsProperties(parentNodeId);
            if (!visJsParentNodeProperties) {
                console.log('could not find the parent node for ' + parentNodeId);
                return
            }
        
            var clusterOptions = {
                joinCondition: function (childOptions) {
                    return childOptions?.payload?.parent === parentNodeId
                },
                clusterNodeProperties: visJsParentNodeProperties
                
            }
            self.network.cluster(clusterOptions);
            self._showNodesNeighborhood(parentNodeId);
        });
    }
    _findNodeByCoordinates(x_hit, y_hit) {
        var nodeid = this.network.getNodeAt({x: x_hit, y: y_hit})
    
        if (!nodeid) {
            console.log('failed to hit a node')
            return
        }
        return this._findNodeById(nodeid);
    }
    _findNodeById(id) {
        return this.nodes.filter((n) => (n.id === id))[0];
    }
    _updateNodeState(nodeId, properties) {
        properties['id'] = nodeId;
        this.nodesDataSet.updateOnly(properties);
    }
    _updateClusterNodeState(nodeId, properties) {
        this.network.updateClusteredNode(nodeId, properties);
    }
    _propertiesHealthy() {
        return {
            color: { background: "#58d68d", highlight: { background: "#58d68d" }}
        };
    }
    _propertiesUnhealthy() {
        return {
            color: { background: "#cd6155", highlight: { background: "#cd6155" }}
        };
    }
    _toExistingNodeIds(nodeIds) {
        const self = this;
        return nodeIds.filter(nId => {
            return self.nodesDataSet.get(nId);
        });
    }
    _toExistingClusterIds(nodeIds) {
        const self = this;
        return nodeIds.filter(nId => {
            const path = self.network.findNode(nId);
            if (!path.length) {
                return false;
            }
            return self.network.isCluster(nId);
        });
    }
    setStates(listOfHealthyNodeIds, listOfUnhealthyNodeIds) {
        const self = this;
        this.healthyNodeIds = listOfHealthyNodeIds;
        this.unhealthyNodeIds = listOfUnhealthyNodeIds;

        // healthy nodes
        const existingHealthyNodeIds = this._toExistingNodeIds(listOfHealthyNodeIds);
        existingHealthyNodeIds.forEach(n => {
            self._updateNodeState(n, self._propertiesHealthy());
        });
        // healthy cluster nodes
        const existingHealthyClusterIds = this._toExistingClusterIds(listOfHealthyNodeIds);
        existingHealthyClusterIds.forEach(n => {
            self._updateClusterNodeState(n, self._propertiesHealthy());
        });
        // unhealthy nodes
        const existingUnhealthyNodeIds = this._toExistingNodeIds(listOfUnhealthyNodeIds);
        existingUnhealthyNodeIds.forEach(n => {
            self._updateNodeState(n, self._propertiesUnhealthy());
        });
        // unhealthy cluster nodes
        const existingUnhealthyClusterIds = this._toExistingClusterIds(listOfUnhealthyNodeIds);
        existingUnhealthyClusterIds.forEach(n => {
            self._updateClusterNodeState(n, self._propertiesUnhealthy());
        });
    }
    
}