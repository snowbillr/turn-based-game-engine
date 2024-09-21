import { number } from '@inquirer/prompts';

// import { Engine } from "../lib/engine.js";
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
    // phase/round/turn callback param
    // const obj = {
      // state: this.state,
      // signals: this.signals
    // }
  }
}

//=== Flow ===//

class Flow {
  startId: string;
  nodes: FlowNode[];
}

interface FlowNode {
  id: string;
  nextId: string;
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

      const turnNodes = turns.flatMap(turn => {
        return this.players.map((player, i) => {
          return {
            id: `${turn.id}::${player.name}`,
            nextId: i === this.players.length - 1 ? round.id : `${turn.id}::${this.players[i + 1].name}`
          }
        })
      })

      const roundNode = {
        id: round.id,
        nextId: turnNodes[0].id
      }

      return [roundNode, ...turnNodes]
    })

    return {
      startId: this.rounds[0].id,
      nodes
    }
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