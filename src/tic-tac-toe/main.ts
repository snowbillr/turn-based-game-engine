import { number } from '@inquirer/prompts';

import { Board } from "./board.js";

//=== Engine ===//

interface EngineConfig {
  players: PlayerConfig[]
  signals: string[]
}

interface PlayerConfig {
  name: string
}

interface State {
  currentPlayer: { name: string }
}


class Engine {
  private players: { name: string }[];
  // private signals: Signal[];
  private flow: Flow;

  private state: State;

  constructor(config: EngineConfig) {
    this.players = config.players;
    this.state = {
      currentPlayer: config.players[0]
    }

    console.log(this.state)

    // this.signals = config.signals.map(signalName => new Signal(signalName))
  }

  defineFlow(flowFn: (f: FlowBuilder) => FlowBuilder): void {
    const flowBuilder = new FlowBuilder(this.players)
    this.flow = flowFn(flowBuilder).build()

    console.log(this.flow)
  }

  start(): void {
    this.flow.current.onStart?.(this.state, this)
  }

  next(): void {
    this.flow.current.onEnd?.(this.state, this)
    this.flow.next()
    this.flow.current.onStart?.(this.state, this)
  }
}

//=== Flow ===//

class Flow {
  private _current: FlowNode;

  constructor(private startId: string, private nodes: FlowNode[]) {
    this.startId = startId;
    this.nodes = nodes;

    this._current = this.nodes.find(node => node.id === this.startId)
  }

  get current(): FlowNode {
    return this._current;
  }

  next(): void {
    this._current = this.nodes.find(node => node.id === this._current.nextId)
  }
}

interface FlowNode {
  id: string;
  nextId: string;
  onStart?: (state: State, f) => void;
  onEnd?: (state: State, f) => void;
}

//=== FlowBuilder ===//

interface FlowBuilderRoundConfig {
  id: string;
  onStart?: (state: State, f) => void;
  onEnd?: (state: State, f) => void;
}

interface FlowBuilderTurnConfig {
  id: string;
  onStart?: (state: State, f) => void;
  onEnd?: (state: State, f) => void;
}

interface FlowBuilderRound {
  id: string;
  onStart?: (state: State, f) => void;
  onEnd?: (state: State, f) => void;
  turns: FlowBuilderTurn[];
}

interface FlowBuilderTurn {
  id: string;
  onStart?: (state: State, f) => void;
  onEnd?: (state: State, f) => void;
}

class FlowBuilder {
  private rounds: FlowBuilderRound[] = [];
  private turns: FlowBuilderTurn[] = [];

  constructor(private players: { name: string }[]) {}

  round(config: FlowBuilderRoundConfig, turn: FlowBuilderTurnConfig): FlowBuilderRoundConfig {
    const round = {
      ...config,
      turns: [turn]
    };

    this.rounds.push(round);

    return round;
  }

  turn(config: FlowBuilderTurnConfig): FlowBuilderTurnConfig {
    this.turns.push(config)

    return config;
  }

  build(): Flow {
    const nodes = this.rounds.flatMap(round => {
      const turns = round.turns;

      const turnNodes: FlowNode[] = turns.flatMap(turn => {
        return this.players.map((player, i) => {
          return {
            id: `${turn.id}::${player.name}`,
            nextId: i === this.players.length - 1 ? round.id : `${turn.id}::${this.players[i + 1].name}`,
            onStart: turn.onStart,
            onEnd: turn.onEnd
          }
        })
      })

      const roundNode: FlowNode = {
        id: round.id,
        nextId: turnNodes[0].id,
        onStart: round.onStart,
        onEnd: round.onEnd
      }

      return [roundNode, ...turnNodes]
    })

    return new Flow(this.rounds[0].id, nodes)
  }
}

//=== Game ===//

const engine = new Engine({
  players: [{ name: 'X' }, { name: 'O' }],
  signals: ['gameOver']
})

engine.defineFlow(f => {
  f.round(
    {
      id: 'round1',
      // repeat: true,
      onStart: () => console.log('Round started'),
      onEnd: () => console.log('Round ended')
    },
    f.turn({
      id: 'turn1',
      onStart: onTurnStart,
      // onEnd: (state) => console.log(`Turn ended for ${state.currentPlayer.name}`),
    })
  )

  return f;
})

const board = new Board()

async function onTurnStart(state, f): Promise<void> {
  console.log(`Turn started for ${state.currentPlayer.name}`)

  board.print()

  let xCoord = -1;
  let yCoord = -1;
  while (!board.isValidMove(xCoord, yCoord)) {
    xCoord = await number({ message: 'x coord:' });
    yCoord = await number({ message: 'y coord:' });
  }

  board.move(state.currentPlayer.name, xCoord, yCoord)

  if (board.hasWinner()) {
    f.signals.gameOver()
  } else {
    f.next()
  }
}