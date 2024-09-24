import { number } from '@inquirer/prompts';

import { Engine } from '../lib/engine.js';

import { Board } from './board.js';
import { FlowOnStartCallback } from '../lib/flow.js';

interface GameState {
  board: Board;
}

const engine = new Engine<GameState>({
  players: [
    { id: 'playerX', name: 'X' },
    { id: 'playerO', name: 'O' },
  ],
  initialState: {
    board: new Board()
  },
});

// TODO - this shouldn't need to declare its param type
const onTurnStart: FlowOnStartCallback<GameState> = async (f) => {
  console.log(`Turn started for ${f.getCurrentPlayer()!.name}`);

  f.state.board.print();

  let xCoord = -1;
  let yCoord = -1;
  while (!f.state.board.isValidMove(xCoord, yCoord)) {
    xCoord = (await number({ message: 'x coord:' })) ?? -1;
    yCoord = (await number({ message: 'y coord:' })) ?? -1;
  }

  f.state.board.move(f.getCurrentPlayer()!.name, xCoord, yCoord);

  if (f.state.board.hasWinner()) {
    f.gameOver();
  } else {
    await f.next();
  }
}

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

function onTurnEnd() {
  console.log('Turn ended.');
}


await engine.start();
