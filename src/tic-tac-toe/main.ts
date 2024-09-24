import { number } from '@inquirer/prompts';

import { Engine, State } from '../lib/engine.js';

import { Board } from './board.js';
import { FlowContext } from '../lib/flow.js';

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

function onTurnEnd() {
  console.log('Turn ended.');
}

async function onTurnStart(_state: State, f: FlowContext) {
  console.log(`Turn started for ${f.getCurrentPlayer()!.name}`);

  board.print();

  let xCoord = -1;
  let yCoord = -1;
  while (!board.isValidMove(xCoord, yCoord)) {
    xCoord = (await number({ message: 'x coord:' })) ?? -1;
    yCoord = (await number({ message: 'y coord:' })) ?? -1;
  }

  board.move(f.getCurrentPlayer()!.name, xCoord, yCoord);

  if (board.hasWinner()) {
    f.gameOver();
  } else {
    await f.next();
  }
}

await engine.start();
