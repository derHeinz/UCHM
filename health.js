class HealthController {

    nodes = null;
    analyzer = null;
    nodeNetwork = null;

    unhealthyNodeIds = [];

    constructor(nodes, analyzer, nodeNetwork) {
        this.nodes = nodes;
        this.analyzer = analyzer;
        this.nodeNetwork = nodeNetwork;
    }

    initialState() {
        this.unhealthyNodeIds = [];
        // calculate the "rest"
        const allHealthyNodeIds = this._calculateHealthyNodes([]);

        // set all
        this.nodeNetwork.setStates(allHealthyNodeIds, this.unhealthyNodeIds);
    }

    _calculateHealthyNodes(allUnhealthyNodeIds) {
        // calculate the "rest"
        const allHealthyNodeIds = []
        this.nodes.forEach(n => {
            if (!allUnhealthyNodeIds.includes(n.id)) {
                allHealthyNodeIds.push(n.id);
            }
        });
        return allHealthyNodeIds;
    }

    _calculateAllUnhealthyNodes() {
        // calculate all dependents
        const allUnhealthyAndAffected = []
        this.unhealthyNodeIds.forEach(nId => {
            const affectedNodeIds = analyzer.affectedNodes(nId);
            allUnhealthyAndAffected.push(nId);
            allUnhealthyAndAffected.push(...affectedNodeIds);
        });
        return [...new Set(allUnhealthyAndAffected)];
    }

    changeState(nodeId, healthyness) {
        if (!healthyness && this.unhealthyNodeIds.includes(nodeId)) {
            // no real change, was unhealthy before
            return;
        }
        if (healthyness && !this.unhealthyNodeIds.includes(nodeId)) {
            // no real change, was healthy before
            return;
        }

        // add or remove from unhealthy nodes
        if (!healthyness) {
            this.unhealthyNodeIds.push(nodeId);
        } else {
            const idx = this.unhealthyNodeIds.indexOf(nodeId);
            this.unhealthyNodeIds.splice(idx, 1);
        }

        const allUnhealthyNodeIds = this._calculateAllUnhealthyNodes();

        // calculate the "rest"
        const allHealthyNodeIds = this._calculateHealthyNodes(allUnhealthyNodeIds);

        // set all
        this.nodeNetwork.setStates(allHealthyNodeIds, allUnhealthyNodeIds);
    } 
}