import { Stack } from './stack.js';
import { Engine, State } from './engine.js';
import { FlowAction, FlowNode } from './flow_node.js';

/*
  The flow of the game is defined as a tree of nodes.
  It is traversed depth-first as the game advances, with one step of the game resulting in visiting a new node.
  A node's onStart callback is executed when the node is visited.
  A node's onEnd callback is executed when all of a node's children have been visited.
  The traversal is restarted when there are no more nodes to visit.
*/
export class Flow {
  private traversalStack = new Stack<FlowNode>();
  private visitedNodeIds: string[] = [];

  private actionStack = new Stack<FlowAction>(); // TODO - make this a queue

  constructor(private nodes: FlowNode[]) {
    this.nodes = nodes;
  }

  start(state: State, f: FlowContext) {
    if (this.nodes.length === 0) throw new Error('Cannot start flow with no nodes');

    const nodes = this.nodes.slice().reverse();
    const currentNode = nodes[0];

    this.traversalStack.push(...nodes);
    this.visitedNodeIds = [currentNode.id];

    this.queueActions(currentNode.actions); // TODO - use visitNode here
    this.runAction(state, f);
  }


  /*
    A depth-first traversal is of the node graph.
    A stack is used to keep track of the nodes that need to be visited. When a node is visited,
    its children are pushed onto the stack in reverse order.
    A list of visited nodes is used to determine if a node is being exited when it returns to the top of the stack.
  */
  next(state: State, f: FlowContext) {
    if (this.traversalStack.size() === 0) {
      this.start(state, f);
      return;
    }

    if (this.actionStack.size() > 0) {
      this.runAction(state, f);
      return;
    }

    const previous = this.traversalStack.peek();

    if (previous.children.length > 0) {
      this.traversalStack.push(...previous.children.slice().reverse());
      this.visitNode(this.currentNode(), state, f);
      return;
    } else {
      // We know better than TypeScript here that the stack is not empty
      // because of the `size` check at the top of `next`.
      this.leaveNode(this.traversalStack.pop()!, state);
      if (this.traversalStack.size() === 0) {
        this.start(state, f);
        return;
      }

      while (this.visitedNodeIds.includes(this.currentNode().id)) {
        // We know better than TypeScript here that the stack is not empty
        // because of the `size` check before this while loop
        this.leaveNode(this.traversalStack.pop()!, state);
        if (this.traversalStack.size() === 0) {
          this.start(state, f);
          return;
        }
      }

      this.visitNode(this.currentNode(), state, f);
    }
  }

  currentNode(): FlowNode {
    return this.traversalStack.peek();
  }

  private visitNode(node: FlowNode, state: State, f: FlowContext) {
    this.visitedNodeIds.push(node.id);

    this.queueActions(node.actions);
    this.runAction(state, f);
  }

  runAction(state: State, f: FlowContext) {
    const action = this.actionStack.pop();
    if (action) action(state, f);
  }

  queueActions(actions: FlowAction[]) {
    this.actionStack.push(...actions);
  }

  private leaveNode(node: FlowNode, state: State) {
    for (const cleanup of node.cleanup) {
      cleanup(state);
    }
  }
}


export interface FlowContext {
  next: Engine['next'];
  gameOver: Engine['gameOver'];
  getCurrentPlayer: Engine['getCurrentPlayer'];
}

