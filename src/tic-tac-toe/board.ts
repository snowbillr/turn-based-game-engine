export class Board {
  private state: (string | null)[][];

  constructor() {
    this.state = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
  }

  isValidMove(x: number, y: number): boolean {
    if (x === -1 && y === -1) return false;
    return this.state[y][x] === null;
  }

  move(player: string, x: number, y: number): void {
    if (this.state[y][x] === null) {
      this.state[y][x] = player;
    } else {
      throw new Error('Invalid move');
    }
  }

  hasWinner(): boolean {
    const winningLines = [
      // Horizontal
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
      ],
      // Vertical
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
      ],
      // Diagonal
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      [
        [0, 2],
        [1, 1],
        [2, 0],
      ],
    ];

    return winningLines.some((line) => {
      const [a, b, c] = line;
      return (
        this.state[a[1]][a[0]] !== null &&
        this.state[a[1]][a[0]] === this.state[b[1]][b[0]] &&
        this.state[a[1]][a[0]] === this.state[c[1]][c[0]]
      );
    });
  }

  print(): void {
    console.log(
      this.state
        .map((row) => row.map((cell) => cell || ' ').join('|'))
        .join('\n-+-+-\n'),
    );
  }
}
