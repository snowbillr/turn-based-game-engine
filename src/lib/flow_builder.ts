import {
  Flow,
  FlowNode,
  FlowOnEndCallback,
  FlowOnStartCallback,
} from './flow.js';

interface FlowBuilderNodeConfig {
  id: string; // TODO - make optional and generate unique ids if missing

  playerId?: string;
  autoAdvance?: boolean;

  onStart?: FlowOnStartCallback;
  onEnd?: FlowOnEndCallback;
}

interface FlowBuilderNode {
  id: string;
  children: FlowBuilderNode[];

  playerId?: string;
  autoAdvance?: boolean;

  onStart?: FlowOnStartCallback;
  onEnd?: FlowOnEndCallback;
}

export class FlowBuilder {
  private nodes: FlowBuilderNode[] = [];

  // TODO add convenience methods for defining nodes
  // - method to build a node for each player
  // - aliases for rounds, turns, etc.

  node(
    config: FlowBuilderNodeConfig,
    children: FlowBuilderNode[] = [],
  ): FlowBuilderNode {
    const flowNode = {
      id: config.id,
      children,

      autoAdvance: config.autoAdvance ?? false,
      playerId: config.playerId,

      onStart: config.onStart,
      onEnd: config.onEnd,
    };

    // don't record leaf nodes
    // leaf nodes will be built from `children` references
    if (children.length > 0) {
      this.nodes.push(flowNode);
    }

    return flowNode;
  }

  build(): Flow {
    const flowNodes = this.nodes.map((n) => this.buildFlowNode(n));

    return new Flow(flowNodes);
  }

  private buildFlowNode(node: FlowBuilderNode): FlowNode {
    return {
      id: node.id,
      children: node.children.map((c) => this.buildFlowNode(c)),
      playerId: node.playerId,
      onStart: node.autoAdvance
        ? async (state, f) => {
            await node.onStart?.(state, f);
            await f.next();
          }
        : node.onStart,
      onEnd: node.onEnd,
    };
  }
}
