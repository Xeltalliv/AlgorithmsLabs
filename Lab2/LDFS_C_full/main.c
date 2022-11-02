#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define queenCount 8
#define fieldSize 8
#define maxDepth 32

#define true 1
#define false 0

int randomInt(int a, int b);
void addRandomly();
int move(int queen, int x, int y, int depth, int last);
int solve();
void draw();
void animate();

struct Queen {
	int x;
	int y;
	int wrong;
};

struct Path {
	int queen;
	int x;
	int y;
};

int playfield[fieldSize][fieldSize] = {0};
struct Queen queens[queenCount];
struct Queen queensInitial[queenCount];
struct Path path[maxDepth];
int pathLength = 0;
int totalWrong = 0;


int main() {
	srandom(time(NULL));
	addRandomly();
	draw();
	printf("Пошук шляху...\n");
	int startTime = time(NULL);

	if(solve()) {
		printf("Шлях знайдено за %i секунд\n", (time(NULL) - startTime));
		animate();
	} else {
		printf("Шлях не знайдено\n");
	}
	return 0;
}

int solve() {
	for(int q=0; q<queenCount; q++) {
		int x = queens[q].x;
		int y = queens[q].y;
		for(int i=0; i<fieldSize; i++) {
			if(x != i && move(q, i, y, 0, 1)) return true;
		}
		for(int i=0; i<fieldSize; i++) {
			if(y != i && move(q, x, i, 0, 2)) return true;
		}
		int z = y-x;
		for(int i=0; i<fieldSize; i++) {
			if(x != i && z+i >= 0 && z+i < fieldSize && move(q, i, z+i, 0, 3)) return true;
		}
		z = y+x;
		for(int i=0; i<fieldSize; i++) {
			if(x != i && z-i >= 0 && z-i < fieldSize && move(q, i, z-i, 0, 4)) return true;
		}
	}
	return false;
}

void addRandomly() {
	int added = 0;
	while(added < queenCount) {
		int x = randomInt(0, fieldSize-1);
		int y = randomInt(0, fieldSize-1);
		int skip = false;
		for(int q=0; q<added; q++) {
			if(queens[q].x == x && queens[q].y == y) skip = true;
		}
		if(skip) continue;
		playfield[y][x] = 1;

		int wrong = 0;
		for(int i=0; i<added; i++) {
			int x2 = queens[i].x;
			int y2 = queens[i].y;
			if(x == x2 || y == y2 || x+y == x2+y2 || x-y == x2-y2) {
				queens[i].wrong++;
				wrong++;
				totalWrong++;
			}
		}
		totalWrong += wrong+1;
		queens[added].x = x;
		queens[added].y = y;
		queens[added].wrong = wrong+1;
		queensInitial[added].x = x;
		queensInitial[added].y = y;
		queensInitial[added].wrong = wrong+1;
		added++;
	}
}

int randomInt(int a, int b) {
	return a + random() % (b - a + 1);
}

int move(int queen, int x, int y, int depth, int last) {
	if(depth >= maxDepth) return false;

	if(playfield[y][x] == 1) return false;

	int oldx = queens[queen].x;
	int oldy = queens[queen].y;
	int oldw = queens[queen].wrong;

	path[pathLength].queen = queen;
	path[pathLength].x = x;
	path[pathLength].y = y;
	pathLength++;

	queens[queen].x = x;
	queens[queen].y = y;
	playfield[y][x] = 1;
	playfield[oldy][oldx] = 0;

	totalWrong -= oldw;
	int wrong = 0;
	for(int i=0; i<queenCount; i++) {
		if(i == queen) continue;
		int x2 = queens[i].x;
		int y2 = queens[i].y;
		if(oldx == x2 || oldy == y2 || oldx+oldy == x2+y2 || oldx-oldy == x2-y2) {
			queens[i].wrong--;
			totalWrong--;
		}
		if(x == x2 || y == y2 || x+y == x2+y2 || x-y == x2-y2) {
			queens[i].wrong++;
			wrong++;
			totalWrong++;
		}
	}
	queens[queen].wrong = wrong+1;
	totalWrong += wrong+1;
	if(totalWrong == queenCount) return true;

	depth++;
	for(int q=0; q<queenCount; q++) {
		int x = queens[q].x;
		int y = queens[q].y;
		for(int i=0, j=fieldSize-1; i<fieldSize; i+=2, j-=2) {
			int other = (q != queen);
			if(other || last != 1) {
				if(x != i && move(q, i, y, depth, 1)) return true;
				if(x != j && move(q, j, y, depth, 1)) return true;
			}
			if(other || last != 2) {
				if(y != i && move(q, x, i, depth, 2)) return true;
				if(y != j && move(q, x, j, depth, 2)) return true;
			}
			if(other || last != 3) {
				int z = y-x;
				if(x != i && z+i >= 0 && z+i < fieldSize && move(q, i, z+i, depth, 3)) return true;
				if(x != j && z+j >= 0 && z+j < fieldSize && move(q, j, z+j, depth, 3)) return true;
			}
			if(other || last != 4) {
				int z = y+x;
				if(x != i && z-i >= 0 && z-i < fieldSize && move(q, i, z-i, depth, 4)) return true;
				if(x != j && z-j >= 0 && z-j < fieldSize && move(q, j, z-j, depth, 4)) return true;
			}
		}
	}
	queens[queen].x = oldx;
	queens[queen].y = oldy;
	queens[queen].wrong = oldw;
	playfield[y][x] = 0;
	playfield[oldy][oldx] = 1;
	totalWrong -= wrong+1;
	totalWrong += oldw;
	for(int i=0; i<queenCount; i++) {
		if(i == queen) continue;
		int x2 = queens[i].x;
		int y2 = queens[i].y;
		if(oldx == x2 || oldy == y2 || oldx+oldy == x2+y2 || oldx-oldy == x2-y2) {
			queens[i].wrong++;
			totalWrong++;
		}
		if(x == x2 || y == y2 || x+y == x2+y2 || x-y == x2-y2) {
			queens[i].wrong--;
			totalWrong--;
		}
	}
	pathLength--;
	return false;
}

void draw() {
	for(int y=0; y<fieldSize; y++) {
		for(int x=0; x<fieldSize; x++) {
			if(playfield[y][x]) {
				printf("_♕");
			} else if((x+y) & 1) {
				printf("██");
			} else {
				printf("░░");
			}
		}
		printf("\n");
	}
}

void animate() {
	for(int y=0; y<fieldSize; y++) {
		for(int x=0; x<fieldSize; x++) {
			playfield[y][x] = 0;
		}
	}
	for(int q=0; q<queenCount; q++) {
		playfield[queensInitial[q].y][queensInitial[q].x] = 1;
	}
	draw(playfield);
	for(int i=0; i<pathLength; i++) {
		printf("Крок #%i:\n", i+1);
		playfield[queensInitial[path[i].queen].y][queensInitial[path[i].queen].x] = 0;
		playfield[path[i].y][path[i].x] = 1;
		queensInitial[path[i].queen].y = path[i].y;
		queensInitial[path[i].queen].x = path[i].x;
		draw(playfield);
	}
}