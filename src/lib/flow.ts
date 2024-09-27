import { Stack } from './stack.js';
import { Engine, State } from './engine.js';

/*
  The flow of the game is defined as a tree of nodes.
  It is traversed depth-first as the game advances, with one step of the game resulting in visiting a new node.
  A node's onStart callback is executed when the node is visited.
  A node's onEnd callback is executed when all of a node's children have been visited.
  The traversal is restarted when there are no more nodes to visit.
*/
export class Flow {
  private traversalStack: Stack<FlowNode> = new Stack();
  private visitedNodeIds: string[] = [];

  constructor(private nodes: FlowNode[]) {
    this.nodes = nodes;
  }

  async start(state: State, f: FlowContext) {
    if (this.nodes.length === 0) throw new Error('Cannot start flow with no nodes');

    const nodes = this.nodes.slice().reverse();
    const currentNode = nodes[0];

    this.traversalStack.push(...nodes);
    this.visitedNodeIds = [currentNode.id];

    await currentNode.runActions(state, f)
  }

  /*
    A depth-first traversal is of the node graph.
    A stack is used to keep track of the nodes that need to be visited. When a node is visited,
    its children are pushed onto the stack in reverse order.
    A list of visited nodes is used to determine if a node is being exited when it returns to the top of the stack.
  */
  async next(state: State, f: FlowContext) {
    if (this.traversalStack.size() === 0) {
      await this.start(state, f);
      return;
    }

    const previous = this.traversalStack.peek();

    if (previous.children.length > 0) {
      this.traversalStack.push(...previous.children.slice().reverse());
      this.visitedNodeIds.push(this.currentNode().id);
      await this.currentNode().runActions(state, f);
    } else {
      this.currentNode().runCleanup(state);
      this.traversalStack.pop();
      if (this.traversalStack.size() === 0) {
        await this.start(state, f);
        return;
      }

      while (this.visitedNodeIds.includes(this.currentNode().id)) {
        this.currentNode().runCleanup(state);
        this.traversalStack.pop();
        if (this.traversalStack.size() === 0) {
          await this.start(state, f);
          return;
        }
      }
      this.visitedNodeIds.push(this.currentNode().id);
      await this.currentNode().runActions(state, f);
    }
  }

  currentNode(): FlowNode {
    return this.traversalStack.peek();
  }
}

export interface FlowNode {
  id: string;
  children: FlowNode[];

  playerId?: string;

  actions?: FlowAction[];
  cleanup?: FlowCleanup[];

  runActions: (state: State, f: FlowContext) => Promise<void>;
  runCleanup: FlowCleanup;
}

export interface FlowContext {
  next: Engine['next'];
  gameOver: Engine['gameOver'];
  getCurrentPlayer: Engine['getCurrentPlayer'];
}

export type FlowAction = (
  state: State,
  f: FlowContext,
) => Promise<void> | void;
export type FlowCleanup = (state: State) => void;
