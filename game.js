'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }
}



class Actor {
    constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
        if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
            throw new Error();
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    }

    act() {}

    get left() {
        return this.pos.x;
    }

    get top() {
        return this.pos.y;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }

    get type() {
        return 'actor';
    }

    isIntersect(anObject) {
        if (anObject === undefined || !(anObject instanceof Actor)) {
            throw new Error();
        }

        if (anObject === this) {
            return false;
        }

        if (this.left >= anObject.right || this.top >= anObject.bottom || anObject.left >= this.right || anObject.top >= this.bottom) {
            return false;
        } else return true;
    }
}



class Level {
    constructor(grid = [], actors = []) {
      this.grid = grid;
      this.actors = actors;
      this.height = grid.length;
      this.player = actors.find(actor => actor.type === 'player');
      this.width = Math.max(0, ...(this.grid.map(item => item.length)));
      this.status = null;
      this.finishDelay = 1;
    }
  
    isFinished() {
        if (this.status !== null && this.finishDelay < 0) {
            return true;
        } else return false;
    }
  
    actorAt(willReturn) {
        if (willReturn === undefined || !(willReturn instanceof Actor)) {
            throw new Error();
        }

        return this.actors.find(function(x) { return x.isIntersect(willReturn)});
    }
  
    obstacleAt(pos, size) {
      const left = Math.floor(pos.x);
      const right = Math.ceil(pos.x + size.x);
      const top = Math.floor(pos.y);
      const bottom = Math.ceil(pos.y + size.y);
      if (!(pos instanceof Vector) || !(size instanceof Vector)) {
        throw new Error('Объект должен быть типа Vector');
      }
  
      if (left < 0 || right > this.width || top < 0) {
        return 'wall';
      }
      if (bottom > this.height) {
        return 'lava';
      }
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const gridBlock = this.grid[y][x];
          if (gridBlock) {
            return gridBlock;
          }
        }
      }
    }
  
    removeActor(actor) {
      const index = this.actors.indexOf(actor);
      if (index != -1) {
        this.actors.splice(index, 1);
      }
    }
  
    noMoreActors(type) {
      return !this.actors.some((actor) => actor.type === type)
    }
  
    playerTouched(type, actor) {
      if (['lava', 'fireball'].some((block) => block === type)) {
        return this.status = 'lost';
      }
      if (type === 'coin' && actor.type === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors('coin')) {
          return this.status = 'won'
        }
      }
    }
  }


  class LevelParser {
    constructor(not) {
        this.not = not;
    }

    actorFromSymbol(char) {
        if (this.not !== undefined && char !== undefined && char in this.not) {
            return this.not[char];
        }
        return undefined;
    }

    obstacleFromSymbol(char) {
        switch (char) {
            case 'x':
                return 'wall';
            case '!':
                return 'lava';
            default:
                return undefined;
        }
    }

    createGrid(argument) {
      return argument.map(line => line.split('')).map(line => line.map(line => this.obstacleFromSymbol(line)));
    }

    createActors(argument) {
        let actors = [];
        for (let i = 0; i < argument.length; i++) {
            for (let j = 0; j < argument[i].length; j++) {
                let actor = this.actorFromSymbol(argument[i].charAt(j));
                if (actor !== undefined && typeof actor === 'function') {
                    let instance = new actor(new Vector(j, i));
                    if (instance instanceof Actor) {
                        actors.push(instance);
                    }
                }
            }
        }
        return actors;
    }

    parse(argument) {
        return new Level(this.createGrid(argument), this.createActors(argument));
    }
}


class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  act(time, level) {
    const next = this.getNextPosition(time);
    if (level.obstacleAt(next, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = next
    }
  }
}


class HorizontalFireball extends Fireball {
  constructor(pos) {
      super(pos, new Vector(2, 0));
  }
}
  

class VerticalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 2));
  }
}