import { number } from '@inquirer/prompts';

import { Board } from './board.js';

//=== Engine ===//

interface EngineConfig {
  players: PlayerConfig[];
}

interface PlayerConfig {
  id: string;
  name: string;
}

interface State {
  currentPlayer: { name: string };
}

class Engine {
  private players: PlayerConfig[];
  private flow: Flow;

  private state: State;

  constructor(config: EngineConfig) {
    this.players = config.players;
    this.state = {
      currentPlayer: config.players[0],
    };

    console.log(this.state, this.players);
  }

  defineFlow(flowFn: (f: FlowBuilder) => FlowBuilder): void {
    const flowBuilder = new FlowBuilder();
    this.flow = flowFn(flowBuilder).build();

    console.log(this.flow);
  }

  gameOver(): void {
    console.log('Game over');
  }
}

//=== Flow ===//

class Flow {
  private _current: FlowNode;

  constructor(
    private startId: string,
    private nodes: FlowNode[],
  ) {
    this.startId = startId;
    this.nodes = nodes;

    console.log(this.startId);
    this.debug();
  }

  get current(): FlowNode {
    return this._current;
  }

  debug(): void {
    this.nodes.forEach((n) => {
      console.log(n.id);
      console.log(n.children.map((c) => c.id));
    });
  }
}

interface FlowNode {
  id: string;
  children: FlowNode[];

  playerId?: string;
  autoAdvance?: boolean;

  onStart?: FlowCallback;
  onEnd?: FlowCallback;
}

type FlowCallback = (state: State, f: Engine) => void;

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

  node(
    config: FlowBuilderNodeConfig,
    children: FlowBuilderNode[] = [],
  ): FlowBuilderNode {
    const flowNode = {
      ...config,
      children,
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

    return new Flow(flowNodes[0].id, flowNodes);
  }

  private buildFlowNode(node: FlowBuilderNode): FlowNode {
    return {
      id: node.id,
      autoAdvance: node.autoAdvance,
      playerId: node.playerId,
      onStart: node.onStart,
      onEnd: node.onEnd,
      children: node.children.map((c) => this.buildFlowNode(c)),
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
        onEnd: (state) =>
          console.log(`Turn ended for ${state.currentPlayer.name}`),
      }),
      f.node({
        id: 'turn1::O',
        playerId: 'playerO',
        onStart: onTurnStart,
        onEnd: (state) =>
          console.log(`Turn ended for ${state.currentPlayer.name}`),
      }),
    ],
  );

  return f;
});

const board = new Board();

async function onTurnStart(state, f): Promise<void> {
  console.log(`Turn started for ${state.currentPlayer.name}`);

  board.print();

  let xCoord = -1;
  let yCoord = -1;
  while (!board.isValidMove(xCoord, yCoord)) {
    xCoord = await number({ message: 'x coord:' });
    yCoord = await number({ message: 'y coord:' });
  }

  board.move(state.currentPlayer.name, xCoord, yCoord);

  if (board.hasWinner()) {
    f.gameOver();
  } else {
    f.next();
  }
}

// engine.start();
