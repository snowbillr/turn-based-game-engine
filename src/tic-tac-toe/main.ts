import { number } from '@inquirer/prompts';

import { Board } from './board.js';

//=== Engine ===//

interface EngineConfig {
  players: Player[];
}

interface Player {
  id: string;
  name: string;
}

type State = Record<string, unknown>;

class Engine {
  private players: Player[];
  private flow: Flow;

  private state: State;

  constructor(config: EngineConfig) {
    this.players = config.players;
    this.state = {};
  }

  defineFlow(flowFn: (f: FlowBuilder) => FlowBuilder): void {
    const flowBuilder = new FlowBuilder();
    this.flow = flowFn(flowBuilder).build();

    console.log(this.flow);
  }

  start(): void {
    this.flow.start(this.state, this);
  }

  next(): void {
    this.flow.next(this.state, this);
  }

  gameOver(): void {
    console.log('Game over');
  }

  getCurrentPlayer(): Player {
    return this.players.find((p) => p.id === this.flow.currentNode().playerId);
  }
}

//=== Flow ===//

/*
  The flow of the game is defined as a tree of nodes.
  It is traversed depth-first as the game advances, with one step of the game resulting in visiting a new node.
  A node's onStart callback is executed when the node is visited.
  A node's onEnd callback is executed when all of a node's children have been visited.
  The traversal is restarted when there are no more nodes to visit.
*/
class Flow {
  private traversalStack: Stack<FlowNode> = new Stack();
  private visitedNodeIds: string[] = [];

  constructor(private nodes: FlowNode[]) {
    this.nodes = nodes;
  }

  start(state, f): void {
    this.visitedNodeIds = [];

    this.traversalStack.push(...this.nodes.slice().reverse());
    this.visitedNodeIds.push(this.currentNode().id);
    this.currentNode().onStart(state, f);
  }

  /*
    A depth-first traversal is of the node graph.
    A stack is used to keep track of the nodes that need to be visited. When a node is visited,
    its children are pushed onto the stack in reverse order.
    A list of visited nodes is used to determine if a node is being exited when it returns to the top of the stack.
  */
  next(state, f): void {
    if (this.traversalStack.size() === 0) {
      this.start(state, f);
      return;
    }

    const previous = this.traversalStack.peek();

    if (previous.children.length > 0) {
      this.traversalStack.push(...previous.children.slice().reverse());
      this.visitedNodeIds.push(this.currentNode().id);
      this.currentNode().onStart?.(state, f);
    } else {
      this.currentNode().onEnd?.(state, f);
      this.traversalStack.pop();
      if (this.traversalStack.size() === 0) {
        this.start(state, f); // empty stack means we need to restart the traversal
        return;
      }

      while (this.visitedNodeIds.includes(this.currentNode().id)) {
        this.currentNode().onEnd?.(state, f);
        this.traversalStack.pop();
        if (this.traversalStack.size() === 0) {
          this.start(state, f); // empty stack means we need to restart the traversal
          return;
        }
      }
      this.visitedNodeIds.push(this.currentNode().id);
      this.currentNode().onStart?.(state, f);
    }
  }

  currentNode(): FlowNode {
    return this.traversalStack.peek();
  }
}

interface FlowNode {
  id: string;
  children: FlowNode[];

  playerId?: string;

  onStart?: FlowCallback;
  onEnd?: FlowCallback;
}

// TODO - when is it safe to call `next()` or `gameOver()`? on callbacks? probably not
// probably need to define what `f` is for each identified callback
type FlowCallback = (state: State, f: Engine) => void;

class Stack<T> {
  private items: T[] = [];

  push(...items): void {
    this.items.push(...items);
  }

  peek(): T {
    return this.items[this.items.length - 1];
  }

  pop(): T {
    return this.items.pop();
  }

  size(): number {
    return this.items.length;
  }
}

//=== FlowBuilder ===//

interface FlowBuilderNodeConfig {
  id: string;

  playerId?: string;
  autoAdvance?: boolean;

  onStart?: FlowCallback;
  onEnd?: FlowCallback;
}

interface FlowBuilderNode {
  id: string;
  children: FlowBuilderNode[];

  playerId?: string;
  autoAdvance?: boolean;

  onStart?: FlowCallback;
  onEnd?: FlowCallback;
}

class FlowBuilder {
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
        ? (state, f): void => {
            node.onStart?.(state, f);
            f.next();
          }
        : node.onStart,
      onEnd: node.onEnd,
    };
  }
}

//=== Game ===//

const engine = new Engine({
  players: [
    { id: 'playerX', name: 'X' },
    { id: 'playerO', name: 'O' },
  ],
});

engine.defineFlow((f) => {
  f.node(
    {
      id: 'round1',
      autoAdvance: true,
      onStart: () => console.log('Round started'),
      onEnd: () => console.log('Round ended'),
    },
    [
      f.node({
        id: 'turn1::X',
        playerId: 'playerX',
        onStart: onTurnStart,
        onEnd: onTurnEnd,
      }),
      f.node({
        id: 'turn1::O',
        playerId: 'playerO',
        onStart: onTurnStart,
        onEnd: onTurnEnd,
      }),
    ],
  );

  return f;
});

const board = new Board();

function onTurnEnd(_state, f): void {
  console.log(`Turn ended for ${f.getCurrentPlayer().name}`);
}

async function onTurnStart(_state, f): Promise<void> {
  console.log(`Turn started for ${f.getCurrentPlayer().name}`);

  board.print();

  let xCoord = -1;
  let yCoord = -1;
  while (!board.isValidMove(xCoord, yCoord)) {
    xCoord = await number({ message: 'x coord:' });
    yCoord = await number({ message: 'y coord:' });
  }

  board.move(f.getCurrentPlayer().name, xCoord, yCoord);

  if (board.hasWinner()) {
    f.gameOver();
  } else {
    f.next();
  }
}

engine.start();
