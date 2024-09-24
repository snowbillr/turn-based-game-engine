import { Stack } from './stack.js';
import { Engine } from './engine.js';

/*
  The flow of the game is defined as a tree of nodes.
  It is traversed depth-first as the game advances, with one step of the game resulting in visiting a new node.
  A node's onStart callback is executed when the node is visited.
  A node's onEnd callback is executed when all of a node's children have been visited.
  The traversal is restarted when there are no more nodes to visit.
*/
export class Flow<State> {
  private traversalStack: Stack<FlowNode<State>> = new Stack();
  private visitedNodeIds: string[] = [];

  constructor(private nodes: FlowNode<State>[]) {
    this.nodes = nodes;
  }

  async start(f: FlowContext<State>) {
    this.visitedNodeIds = [];

    this.traversalStack.push(...this.nodes.slice().reverse());
    this.visitedNodeIds.push(this.currentNode().id);
    await this.currentNode().onStart?.(f);
  }

  /*
    A depth-first traversal is of the node graph.
    A stack is used to keep track of the nodes that need to be visited. When a node is visited,
    its children are pushed onto the stack in reverse order.
    A list of visited nodes is used to determine if a node is being exited when it returns to the top of the stack.
  */
  async next(f: FlowContext<State>) {
    if (this.traversalStack.size() === 0) {
      await this.start(f);
      return;
    }

    const previous = this.traversalStack.peek();

    if (previous.children.length > 0) {
      this.traversalStack.push(...previous.children.slice().reverse());
      this.visitedNodeIds.push(this.currentNode().id);
      await this.currentNode().onStart?.(f);
    } else {
      this.currentNode().onEnd?.();
      this.traversalStack.pop();
      if (this.traversalStack.size() === 0) {
        await this.start(f);
        return;
      }

      while (this.visitedNodeIds.includes(this.currentNode().id)) {
        this.currentNode().onEnd?.();
        this.traversalStack.pop();
        if (this.traversalStack.size() === 0) {
          await this.start(f);
          return;
        }
      }
      this.visitedNodeIds.push(this.currentNode().id);
      await this.currentNode().onStart?.(f);
    }
  }

  currentNode(): FlowNode<State> {
    return this.traversalStack.peek();
  }
}

export interface FlowNode<State> {
  id: string;
  children: FlowNode<State>[];

  playerId?: string;

  onStart?: FlowOnStartCallback<State>;
  onEnd?: FlowOnEndCallback;
}

export type FlowContext<State> = Pick<Engine<State>, 'next' | 'gameOver' | 'getCurrentPlayer'> & { state: State };

export type FlowOnStartCallback<State> = (
  f: FlowContext<State>,
) => Promise<void> | void;
export type FlowOnEndCallback = () => void;
