import { Player } from './engine.js';
import { Flow } from './flow.js';
import { FlowNode, FlowAction, FlowCleanup } from './flow_node.js';

interface FlowBuilderNodeConfig {
  id: string; // TODO - make optional and generate unique ids if missing

  playerId?: string;

  actions?: FlowAction[];
  cleanup?: FlowCleanup[];
}

export class FlowBuilder {
  private nodes: FlowNode[] = [];

  constructor(
    private players: Player[],
  ) {}

  // TODO add convenience methods for defining nodes
  // - method to build a node for each player
  // - method to wrap an action as autoadvance
  // - aliases for rounds, turns, etc.

  node(
    config: FlowBuilderNodeConfig,
    children: FlowNode[] = [],
  ): FlowNode {
    const flowNode = new FlowNode(
      config.id,
      children,
      {
        playerId: config.playerId,
        actions: config.actions,
        cleanup: config.cleanup,
      }
    );

    // don't record leaf nodes
    // leaf nodes will be built from `children` references
    if (children.length > 0) {
      this.nodes.push(flowNode);
    }

    return flowNode;
  }

  // convenience methods

  eachPlayerNode(fn: (player: Player) => FlowBuilderNodeConfig) {
    return this.players
      .map(fn)
      .map((config) => this.node(config))
  }

  build(): Flow {
    return new Flow(this.nodes);
  }
}
