var NONE = 4,
    UP = 3,
    LEFT = 2,
    DOWN = 1,
    RIGHT = 11,
    WAITING = 5,
    PAUSE = 6,
    PLAYING = 7,
    COUNTDOWN = 8,
    EATEN_PAUSE = 9,
    DYING = 10,
    level = 0,
    userdue = 0,
    userdirection = 0,
    userposition = 0,
    botmanposition=0,
    lives = 0,
    startx = 0,
    starty = 0,
    score = 5,
    Hunter = {};

Hunter.FPS = 25;

Hunter.Ghost = function(game, map, colour) {

    var position = null,
        direction = null,
        eatable = null,
        eaten = null,
        due = null;

    function getNewCoord(dir, current) {

        var speed = isVunerable() ? 1 : isHidden() ? 4 : 2,
            xSpeed = (dir === LEFT && -speed || dir === RIGHT && speed || 0),
            ySpeed = (dir === DOWN && speed || dir === UP && -speed || 0);

        return {
            "x": addBounded(current.x, xSpeed),
            "y": addBounded(current.y, ySpeed)
        };
    };

    /* Collision detection(walls) is done when a ghost lands on an
     * exact block, make sure they dont skip over it
     */
    function addBounded(x1, x2) {
        var rem = x1 % 10,
            result = rem + x2;
        if (rem !== 0 && result > 10) {
            return x1 + (10 - rem);
        }
        else if (rem > 0 && result < 0) {
            return x1 - rem;
        }
        return x1 + x2;
    };

    function isVunerable() {
        return eatable !== null;
    };

    function isDangerous() {
        return eaten === null;
    };

    function isHidden() {
        return eatable === null && eaten !== null;
    };

    function getRandomDirection() {
        var moves = (direction === LEFT || direction === RIGHT) ? [UP, DOWN] : [LEFT, RIGHT];
        return moves[Math.floor(Math.random() * 2)];
    };

    function reset() {
        eaten = null;
        eatable = null;
        position = {
            "x": 90,
            "y": 80
        };
        direction = getRandomDirection();
        due = getRandomDirection();
    };

    function onWholeSquare(x) {
        return x % 10 === 0;
    };

    function oppositeDirection(dir) {
        return dir === LEFT && RIGHT ||
            dir === RIGHT && LEFT ||
            dir === UP && DOWN || UP;
    };

    function makeEatable() {
        direction = oppositeDirection(direction);
        eatable = game.getTick();
    };

    function eat() {
        eatable = null;
        eaten = game.getTick();
        //audio.play("eating");
    };

    function pointToCoord(x) {
        return Math.round(x / 10);
    };

    function nextSquare(x, dir) {
        var rem = x % 10;
        if (rem === 0) {
            return x;
        }
        else if (dir === RIGHT || dir === DOWN) {
            return x + (10 - rem);
        }
        else {
            return x - rem;
        }
    };

    function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    };

    function secondsAgo(tick) {
        return (game.getTick() - tick) / Hunter.FPS;
    };

    function getColour() {
        if (eatable) {
            if (secondsAgo(eatable) > 5) {
                return game.getTick() % 20 > 10 ? "#FFFFFF" : "#0000BB";
            }
            else {
                return "#0000BB";
            }
        }
        else if (eaten) {
            return "#222";
        }
        return colour;
    };

    function draw(ctx) {

        var s = map.blockSize,
            top = (position.y / 10) * s,
            left = (position.x / 10) * s;

        if (eatable && secondsAgo(eatable) > 8) {
            eatable = null;
        }

        if (eaten && secondsAgo(eaten) > 3) {
            eaten = null;
        }

        var tl = left + s;
        var base = top + s - 3;
        var inc = s / 10;

        var high = game.getTick() % 10 > 5 ? 3 : -3;
        var low = game.getTick() % 10 > 5 ? -3 : 3;

        ctx.fillStyle = getColour();
        ctx.beginPath();

        ctx.moveTo(left, base);

        ctx.quadraticCurveTo(left, top, left + (s / 2), top);
        ctx.quadraticCurveTo(left + s, top, left + s, base);

        // Wavy things at the bottom
        ctx.quadraticCurveTo(tl - (inc * 1), base + high, tl - (inc * 2), base);
        ctx.quadraticCurveTo(tl - (inc * 3), base + low, tl - (inc * 4), base);
        ctx.quadraticCurveTo(tl - (inc * 5), base + high, tl - (inc * 6), base);
        ctx.quadraticCurveTo(tl - (inc * 7), base + low, tl - (inc * 8), base);
        ctx.quadraticCurveTo(tl - (inc * 9), base + high, tl - (inc * 10), base);

        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "#FFF";
        ctx.arc(left + 6, top + 6, s / 6, 0, 300, false);
        ctx.arc((left + s) - 6, top + 6, s / 6, 0, 300, false);
        ctx.closePath();
        ctx.fill();

        var f = s / 12;
        var off = {};
        off[RIGHT] = [f, 0];
        off[LEFT] = [-f, 0];
        off[UP] = [0, -f];
        off[DOWN] = [0, f];

        ctx.beginPath();
        ctx.fillStyle = "#000";
        ctx.arc(left + 6 + off[direction][0], top + 6 + off[direction][1],
            s / 15, 0, 300, false);
        ctx.arc((left + s) - 6 + off[direction][0], top + 6 + off[direction][1],
            s / 15, 0, 300, false);
        ctx.closePath();
        ctx.fill();

    };

    function pane(pos) {

        if (pos.y === 100 && pos.x >= 190 && direction === RIGHT) {
            return {
                "y": 100,
                "x": -10
            };
        }

        if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
            return position = {
                "y": 100,
                "x": 190
            };
        }

        return false;
    };

    function move(ctx) {

        var oldPos = position,
            onGrid = onGridSquare(position),
            npos = null;

        if (due !== direction) {

            npos = getNewCoord(due, position);

            if (onGrid &&
                map.isFloorSpace({
                    "y": pointToCoord(nextSquare(npos.y, due)),
                    "x": pointToCoord(nextSquare(npos.x, due))
                })) {
                direction = due;
            }
            else {
                npos = null;
            }
        }

        if (npos === null) {
            npos = getNewCoord(direction, position);
        }

        if (onGrid &&
            map.isWallSpace({
                "y": pointToCoord(nextSquare(npos.y, direction)),
                "x": pointToCoord(nextSquare(npos.x, direction))
            })) {

            due = getRandomDirection();
            return move(ctx);
        }

        position = npos;

        var tmp = pane(position);
        if (tmp) {
            position = tmp;
        }

        due = getRandomDirection();
        if (level == 5) {
            if (userposition.x - position.x >= 4 || position.x - userposition.x >= 4) {
                if (userposition.y - position.y >= 4 || position.y - userposition.y >= 4) {
                    due = userdue;
                }
            }
        }
        if (level == 7) {
            if (Math.floor(Math.random() * 2)==1) {
                (userposition.x >= position.x)? due = LEFT : due = RIGHT;
                (userposition.y >= position.y)? due = DOWN : due = UP;
            }
            else {
                (botmanposition.x >= position.x)? due = LEFT : due = RIGHT;
                (botmanposition.y >= position.y)? due = DOWN : due = UP;
             }
        }

        if (level == 9) {
            if (userposition.x - position.x >= botmanposition.x - position.x)
                (userposition.x - position.x >= userposition.y - position.y)? due = LEFT : due = RIGHT;

            else
                (botmanposition.x >= position.x)? due = LEFT : due = RIGHT;

            if (userposition.y - position.y >= botmanposition.y - position.y)
                (userposition.y - position.y >= userposition.x - position.x)? due = DOWN : due = UP;
            else
                (botmanposition.y >= position.y)? due = DOWN : due = UP;
        }

        if (level > 9) {
            due = getRandomDirection();
            if (userposition.x == position.x)
               (userposition.y > position.y)? due = DOWN : due = UP;
            if (userposition.y == position.y)
                (userposition.x < position.x)? due = LEFT : due = RIGHT;

        }

        return {
            "new": position,
            "old": oldPos
        };
    };

    return {
        "eat": eat,
        "isVunerable": isVunerable,
        "isDangerous": isDangerous,
        "makeEatable": makeEatable,
        "reset": reset,
        "move": move,
        "draw": draw
    };
};

Hunter.User = function(game, map) {

    var position = null,
        direction = null,
        eaten = null,
        due = null,
        keyMap = {};

    keyMap[KEY.ARROW_LEFT] = LEFT;
    keyMap[KEY.ARROW_UP] = UP;
    keyMap[KEY.ARROW_RIGHT] = RIGHT;
    keyMap[KEY.ARROW_DOWN] = DOWN;

    function addScore(nScore) {
        if (level == 4)
            score -= nScore;
        else
            score += nScore;
        if (score >= 5000 && score - nScore < 5000) {
            lives = 4;
        }
    };

    function loseLife() {
        lives -= 1;
    };

    function getLives() {
        return lives;
    };

    function initUser() {
        score = 0;
        lives = 4;
        newLevel();
    }

    function newLevel() {
        resetPosition();
        eaten = 0;
    };

    function resetPosition() {
        position = {
            "x": 90,
            "y": 120
        };
        direction = LEFT;
        due = LEFT;
    };

    function reset() {
        initUser();
        resetPosition();
    };

    function keyDown(e) {
        if (typeof keyMap[e.keyCode] !== "undefined") {
            due = keyMap[e.keyCode];
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        return true;
    };

    function getNewCoord(dir, current) {
        return {
            "x": current.x + (dir === LEFT && -2 || dir === RIGHT && 2 || 0),
            "y": current.y + (dir === DOWN && 2 || dir === UP && -2 || 0)
        };
    };

    function onWholeSquare(x) {
        return x % 10 === 0;
    };

    function pointToCoord(x) {
        return Math.round(x / 10);
    };

    function nextSquare(x, dir) {
        var rem = x % 10;
        if (rem === 0) {
            return x;
        }
        else if (dir === RIGHT || dir === DOWN) {
            return x + (10 - rem);
        }
        else {
            return x - rem;
        }
    };

    function next(pos, dir) {
        return {
            "y": pointToCoord(nextSquare(pos.y, dir)),
            "x": pointToCoord(nextSquare(pos.x, dir)),
        };
    };

    function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    };

    function isOnSamePlane(due, dir) {
        return ((due === LEFT || due === RIGHT) &&
                (dir === LEFT || dir === RIGHT)) ||
            ((due === UP || due === DOWN) &&
                (dir === UP || dir === DOWN));
    };

    function move(ctx) {
        var npos = null,
            nextWhole = null,
            oldPosition = position,
            block = null;

        if (due !== direction) {
            npos = getNewCoord(due, position);

            if (isOnSamePlane(due, direction) ||
                (onGridSquare(position) &&
                    map.isFloorSpace(next(npos, due)))) {
                direction = due;
            }
            else {
                npos = null;
            }
        }

        if (npos === null) {
            npos = getNewCoord(direction, position);
        }

        if (onGridSquare(position) && map.isWallSpace(next(npos, direction))) {
            direction = NONE;
        }

        if (direction === NONE) {
            return {
                "new": position,
                "old": position
            };
        }

        if (npos.y === 100 && npos.x >= 190 && direction === RIGHT) {
            npos = {
                "y": 100,
                "x": -10
            };
        }

        if (npos.y === 100 && npos.x <= -12 && direction === LEFT) {
            npos = {
                "y": 100,
                "x": 190
            };
        }

        position = npos;
        nextWhole = next(position, direction);

        block = map.block(nextWhole);

        if ((isMidSquare(position.y) || isMidSquare(position.x)) &&
            block === Hunter.BISCUIT || block === Hunter.PILL) {

            map.setBlock(nextWhole, Hunter.EMPTY);
            addScore((block === Hunter.BISCUIT) ? 10 : 50);
            eaten += 1;
            //audio.play("eating");
            if (eaten === 182) {
                game.completedLevel();
            }

            if (block === Hunter.PILL) {
                game.eatenPill();
            }
        }

        userdirection = direction;
        userdue = due;
        userposition = position;

        return {
            "new": position,
            "old": oldPosition
        };
    };

    function isMidSquare(x) {
        var rem = x % 10;
        return rem > 3 || rem < 7;
    };

    function calcAngle(dir, pos) {
        if (dir == RIGHT && (pos.x % 10 < 5)) {
            return {
                "start": 0.25,
                "end": 1.75,
                "direction": false
            };
        }
        else if (dir === DOWN && (pos.y % 10 < 5)) {
            return {
                "start": 0.75,
                "end": 2.25,
                "direction": false
            };
        }
        else if (dir === UP && (pos.y % 10 < 5)) {
            return {
                "start": 1.25,
                "end": 1.75,
                "direction": true
            };
        }
        else if (dir === LEFT && (pos.x % 10 < 5)) {
            return {
                "start": 0.75,
                "end": 1.25,
                "direction": true
            };
        }
        return {
            "start": 0,
            "end": 2,
            "direction": false
        };
    };

    function drawDead(ctx, amount) {
        var size = map.blockSize,
            half = size / 2;

        if (amount >= 1) {
            return;
        }

        ctx.fillStyle = "#FFE6FF";
        ctx.beginPath();
        ctx.moveTo(((position.x / 10) * size) + half,
            ((position.y / 10) * size) + half);

        ctx.arc(((position.x / 10) * size) + half,
            ((position.y / 10) * size) + half,
            half, 0, Math.PI * 2 * amount, true);

        ctx.fill();
    };

    function draw(ctx) {

        var s = map.blockSize,
            angle = calcAngle(direction, position);

        ctx.fillStyle = "#FFE6FF";

        ctx.beginPath();

        ctx.moveTo(((position.x / 10) * s) + s / 2,
            ((position.y / 10) * s) + s / 2);

        ctx.arc(((position.x / 10) * s) + s / 2,
            ((position.y / 10) * s) + s / 2,
            s / 2, Math.PI * angle.start,
            Math.PI * angle.end, angle.direction);

        ctx.fill();
    };

    initUser();

    return {
        "draw": draw,
        "drawDead": drawDead,
        "loseLife": loseLife,
        "getLives": getLives,
        "addScore": addScore,
        "keyDown": keyDown,
        "move": move,
        "newLevel": newLevel,
        "reset": reset,
        "resetPosition": resetPosition
    };
};

Hunter.BotMan = function(game, map) {

    var position = null,
        direction = null,
        due = null;

    function initUser() {
        newLevel();
    }

    function newLevel() {
        resetPosition();
    };

    function resetPosition() {
        position = {
            "x": 110,
            "y": 120
        };
        direction = RIGHT;
        due = RIGHT;
    };

    function reset() {
        initUser();
        resetPosition();
    };

    function getNewCoord(dir, current) {
        return {
            "x": current.x + (dir === LEFT && -2 || dir === RIGHT && 2 || 0),
            "y": current.y + (dir === DOWN && 2 || dir === UP && -2 || 0)
        };
    };

    function onWholeSquare(x) {
        return x % 10 === 0;
    };

    function pointToCoord(x) {
        return Math.round(x / 10);
    };

    function nextSquare(x, dir) {
        var rem = x % 10;
        if (rem === 0) {
            return x;
        }
        else if (dir === RIGHT || dir === DOWN) {
            return x + (10 - rem);
        }
        else {
            return x - rem;
        }
    };

    function next(pos, dir) {
        return {
            "y": pointToCoord(nextSquare(pos.y, dir)),
            "x": pointToCoord(nextSquare(pos.x, dir)),
        };
    };

    function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    };

    function isOnSamePlane(due, dir) {
        return ((due === LEFT || due === RIGHT) &&
                (dir === LEFT || dir === RIGHT)) ||
            ((due === UP || due === DOWN) &&
                (dir === UP || dir === DOWN));
    };

    function getRandomDirection() {
        var moves = (direction === LEFT || direction === RIGHT) ? [UP, DOWN] : [LEFT, RIGHT];
        return moves[Math.floor(Math.random() * 2)];
    };
    function move(ctx) {

        var oldPos = position,
            npos = null;


        if (due !== direction) {
            npos = getNewCoord(due, position);

            if (isOnSamePlane(due, direction) ||
                (onGridSquare(position) &&
                    map.isFloorSpace(next(npos, due)))) {
                direction = due;
            }
            else {
                npos = null;
            }
        }

        if (npos === null) {
            npos = getNewCoord(direction, position);
        }

        if (onGridSquare(position) && map.isWallSpace(next(npos, direction))) {
            direction = NONE;
            return {
                "new": position,
                "old": position
            };
        }

        if (level >= 2) {
            if (npos.y === 100 && npos.x >= 190 && direction === RIGHT)
                npos = {
                    "y": 100,
                    "x": -10
                };
            if (npos.y === 100 && npos.x <= -12 && direction === LEFT)
                npos = {
                    "y": 100,
                    "x": 190
                };
            //if ((level == 2) && (position.x == userposition.x) && (userposition.y - position.y >= 2 || userposition.y - position.y <= 2))
            if ((level == 2 || level == 8) && (position.x == userposition.x) && (userposition.y ==position.y))
                lives = 4;
            if ((level == 9) && (position.x == userposition.x) && (userposition.y ==position.y))
                lives -=1;
        }

        position = npos;

        if (level == 1 || level == 5 || level == 8) {
            due = getRandomDirection();
        }
        else if (level == 2 || level == 7 || level == 9) {
            due = userdue;
        }
        else if (level == 3 || level == 4 || level == 6) {
            due = userdirection === LEFT && RIGHT || userdirection === RIGHT && LEFT || userdirection === UP && DOWN || UP;
        }

        botmanposition = position;

        return {
            "new": position,
            "old": oldPos
        };
    };

    function calcAngle(dir, pos) {
        if (dir == RIGHT && (pos.x % 10 < 5)) {
            return {
                "start": 0.25,
                "end": 1.75,
                "direction": false
            };
        }
        else if (dir === DOWN && (pos.y % 10 < 5)) {
            return {
                "start": 0.75,
                "end": 2.25,
                "direction": false
            };
        }
        else if (dir === UP && (pos.y % 10 < 5)) {
            return {
                "start": 1.25,
                "end": 1.75,
                "direction": true
            };
        }
        else if (dir === LEFT && (pos.x % 10 < 5)) {
            return {
                "start": 0.75,
                "end": 1.25,
                "direction": true
            };
        }
        return {
            "start": 0,
            "end": 2,
            "direction": false
        };
    };

    function draw(ctx) {

        var     s = map.blockSize,
            angle = calcAngle(direction, position);

        if (level == 8 && lives != 4)
            ctx.fillStyle = "#ff0000";
        else if ((level == 3) || (level == 8 && lives == 4))
            ctx.fillStyle = "#000000";
        else
            ctx.fillStyle = "#ff0000";

        ctx.beginPath();

        ctx.moveTo(((position.x / 10) * s) + s / 2,
            ((position.y / 10) * s) + s / 2);

        ctx.arc(((position.x / 10) * s) + s / 2,
            ((position.y / 10) * s) + s / 2,
            s / 2, Math.PI * angle.start,
            Math.PI * angle.end, angle.direction);

        ctx.fill();
    };

    initUser();

    return {
        "draw": draw,
        "move": move,
        "newLevel": newLevel,
        "reset": reset,
        "resetPosition": resetPosition
    };
};


Hunter.Map = function(size) {

    var height = null,
        width = null,
        blockSize = size,
        pillSize = 0,
        map = null;

    function withinBounds(y, x) {
        return y >= 0 && y < height && x >= 0 && x < width;
    }

    function isWall(pos) {
        return withinBounds(pos.y, pos.x) && map[pos.y][pos.x] === Hunter.WALL;
    }

    function isFloorSpace(pos) {
        if (!withinBounds(pos.y, pos.x)) {
            return false;
        }
        var peice = map[pos.y][pos.x];
        return peice === Hunter.EMPTY ||
            peice === Hunter.BISCUIT ||
            peice === Hunter.PILL;
    }

    function drawWall(ctx) {

        var i, j, p, line;
        ctx.strokeStyle = "#000000";
        if ((7 > Math.floor(Math.random() * (11 - 2)) + 1) && (level != 3)) {
            if (level == 3)
                ctx.strokeStyle = "#000000";
            else if (level == 8) {
                var gradient=ctx.createLinearGradient(0,0, 342,0);
                gradient.addColorStop("0","white");
                gradient.addColorStop("0.2","yellow");
                gradient.addColorStop("0.4","#faebd7");
                gradient.addColorStop("0.7","yellow");
                gradient.addColorStop("1","#faebd7");
                ctx.strokeStyle=gradient;
            }
            else if (level == 9) {
                var gradient=ctx.createLinearGradient(0,0, 342,0);
                gradient.addColorStop("0","white");
                gradient.addColorStop("0.2","blue");
                gradient.addColorStop("0.4","#faebd7");
                gradient.addColorStop("0.7","blue");
                gradient.addColorStop("1","#faebd7");
                ctx.strokeStyle=gradient;
            }
            else {
                var gradient=ctx.createLinearGradient(0,0, 342,0);
                gradient.addColorStop("0","white");
                gradient.addColorStop("0.2","red");
                gradient.addColorStop("0.4","#faebd7");
                gradient.addColorStop("0.7","red");
                gradient.addColorStop("1","#faebd7");
                ctx.strokeStyle=gradient;
               // ctx.strokeStyle = "#ef3340";
               }
        }
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        for (i = 0; i < Hunter.WALLS.length; i += 1) {
            line = Hunter.WALLS[i];
            ctx.beginPath();

            for (j = 0; j < line.length; j += 1) {

                p = line[j];

                if (p.move) {
                    ctx.moveTo(p.move[0] * blockSize, p.move[1] * blockSize);
                }
                else if (p.line) {
                    ctx.lineTo(p.line[0] * blockSize, p.line[1] * blockSize);
                }
                else if (p.curve) {
                    ctx.quadraticCurveTo(p.curve[0] * blockSize,
                        p.curve[1] * blockSize,
                        p.curve[2] * blockSize,
                        p.curve[3] * blockSize);
                }
            }
            ctx.stroke();
        }
    }

    function reset() {
        map = Hunter.MAP.clone();
        height = map.length;
        width = map[0].length;
    };

    function block(pos) {
        return map[pos.y][pos.x];
    };

    function setBlock(pos, type) {
        map[pos.y][pos.x] = type;
    };

    function drawPills(ctx) {

        if (++pillSize > 30) {
            pillSize = 0;
        }
        for (i = 0; i < height; i += 1) {
            for (j = 0; j < width; j += 1) {
                if (map[i][j] === Hunter.PILL) {
                    ctx.beginPath();
                    if (level != 6) {
                        ctx.fillStyle = "#000";
                        ctx.fillRect((j * blockSize), (i * blockSize),
                            blockSize, blockSize);

                        ctx.fillStyle = "#FFF";
                        ctx.rect((j * blockSize) + (blockSize / 2), (i * blockSize) + (blockSize / 2), Math.abs(5 - (pillSize / 3)), Math.PI * 2);
                        // ctx.arc((j * blockSize) + blockSize,
                        //         (i * blockSize) + blockSize,
                        //         Math.abs(5 - (pillSize/3)),
                        //         0,
                        //         Math.PI * 2, false);
                    }
                    else {
                        ctx.drawImage(img_heal, (j * blockSize), (i * blockSize));
                        //                     ctx.fillStyle = "#000";
                        // 		            ctx.fillRect((j * blockSize), (i * blockSize),
                        //                                  blockSize, blockSize);

                        //                     ctx.fillStyle = "#FFF";
                        //                     ctx.rect((j * blockSize),(i* blockSize), Math.abs(5 - (pillSize/3)),Math.PI * 2);
                        //                     //  ctx.arcTo((j * blockSize),  (i * blockSize),
                        //                     //         Math.abs(5 - (pillSize/3)),
                        //                     //         Math.PI * 2,0);
                    }
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    };

    function draw(ctx) {

        var i, j, size = blockSize;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width * size, height * size);

        drawWall(ctx);

        for (i = 0; i < height; i += 1) {
            for (j = 0; j < width; j += 1) {
                drawBlock(i, j, ctx);
            }
        }
    };

    function drawBlock(y, x, ctx) {

        var layout = map[y][x];

        if (layout === Hunter.PILL) {
            return;
        }

        ctx.beginPath();

        if (layout === Hunter.EMPTY || layout === Hunter.BLOCK ||
            layout === Hunter.BISCUIT) {

            ctx.fillStyle = "#000";
            ctx.fillRect((x * blockSize), (y * blockSize),
                blockSize, blockSize);

            if (layout === Hunter.BISCUIT) {
                ctx.fillStyle = "#8a2be2"; //BISCUIT visible or not
                // if ((y > Math.floor(Math.random() * (22 - 8)) + 7) || (level==8 && Math.floor(Math.random() * 9) % 2==1)) {
                if ((Math.floor(Math.random() * 9) % 2==1) || (level==8 && Math.floor(Math.random() * 9) % 2==1)) {
                    ctx.fillStyle = "#000000"; //BISCUIT visible or not
                }
                ctx.fillRect((x * blockSize) + (blockSize / 2.5),
                    (y * blockSize) + (blockSize / 2.5),
                    blockSize / 6, blockSize / 6);
            }
        }
        ctx.closePath();
    };

    reset();

    return {
        "draw": draw,
        "drawBlock": drawBlock,
        "drawPills": drawPills,
        "block": block,
        "setBlock": setBlock,
        "reset": reset,
        "isWallSpace": isWall,
        "isFloorSpace": isFloorSpace,
        "height": height,
        "width": width,
        "blockSize": blockSize
    };
};

Hunter.Audio = function(game) {

    var files = [],
        endEvents = [],
        progressEvents = [],
        playing = [];

    function load(name, path, cb) {

        var f = files[name] = document.createElement("audio");

        progressEvents[name] = function(event) {
            progress(event, name, cb);
        };

        f.addEventListener("canplaythrough", progressEvents[name], true);
        f.setAttribute("preload", "true");
        f.setAttribute("autobuffer", "true");
        f.setAttribute("src", path);
        f.pause();
    };

    function progress(event, name, callback) {
        if (event.loaded === event.total && typeof callback === "function") {
            callback();
            files[name].removeEventListener("canplaythrough",
                progressEvents[name], true);
        }
    };

    function disableSound() {
        for (var i = 0; i < playing.length; i++) {
            files[playing[i]].pause();
            files[playing[i]].currentTime = 0;
        }
        playing = [];
    };

    function ended(name) {

        var i, tmp = [],
            found = false;

        files[name].removeEventListener("ended", endEvents[name], true);

        for (i = 0; i < playing.length; i++) {
            if (!found && playing[i]) {
                found = true;
            }
            else {
                tmp.push(playing[i]);
            }
        }
        playing = tmp;
    };

    function play(name) {
        if (!game.soundDisabled()) {
            endEvents[name] = function() {
                ended(name);
            };
            playing.push(name);
            files[name].addEventListener("ended", endEvents[name], true);
            files[name].play();
        }
    };

    function pause() {
        for (var i = 0; i < playing.length; i++) {
            files[playing[i]].pause();
        }
    };

    function resume() {
        for (var i = 0; i < playing.length; i++) {
            files[playing[i]].play();
        }
    };

    return {
        "disableSound": disableSound,
        "load": load,
        "play": play,
        "pause": pause,
        "resume": resume
    };
};

var HUNTER = (function() {

    var state = WAITING,
        audio = null,
        ghosts = [],
        ghostSpecs = ["#00FFDE", "#FF0000", "#FFB8DE", "#FFB847"],
        eatenCount = 0,

        tick = 0,
        ghostPos, userPos,
        stateChanged = true,
        timerStart = null,
        lastTime = 0,
        ctx = null,
        timer = null,
        map = null,
        user = null,
        botman = null,
        stored = null;

    function getTick() {
        return tick;
    };

    function drawScore(text, position) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 18px arial";
        ctx.fillText(text,
            (position["new"]["x"] / 10) * map.blockSize,
            ((position["new"]["y"] + 5) / 10) * map.blockSize);
    }

    function dialog(text) {
        var gradient=ctx.createLinearGradient(0,0, ctx.measureText(text).width,0);
        gradient.addColorStop("0","white");
        gradient.addColorStop("0.2","red");
        gradient.addColorStop("0.4","#faebd7");
        gradient.addColorStop("0.7","red");
        gradient.addColorStop("1","#faebd7");
        ctx.fillStyle=gradient;
        ctx.font = "bold 16px Comic Sans MS";
        var width = ctx.measureText(text).width,
            x = ((map.width * map.blockSize) - width) / 2;
        ctx.fillText(text, x, (map.height * 10) + 8);
    }

    function soundDisabled() {
        return localStorage["soundDisabled"] === "true";
    };

    function startLevel() {
        user.resetPosition();
        botman.resetPosition();
        for (var i = 0; i < ghosts.length; i += 1) {
            ghosts[i].reset();
        }
        //  audio.play("start");
        timerStart = tick;
        map.draw(ctx);
        setState(COUNTDOWN);
    }

    function startNewGame() {
        setState(WAITING);
        level = 1;
        user.reset();
        botman.reset();
        map.reset();
        map.draw(ctx);
        startLevel();
    }

    function keyDown(e) {
        if (e.keyCode === KEY.H) {
            startNewGame();
        }
        else if (e.keyCode === KEY.S) {
            audio.disableSound();
            localStorage["soundDisabled"] = !soundDisabled();
        }
        else if (e.keyCode === KEY.P && state === PAUSE) {
            audio.resume();
            map.draw(ctx);
            setState(stored);
        }
        else if (e.keyCode === KEY.P) {
            stored = state;
            setState(PAUSE);
            audio.pause();
            map.draw(ctx);
            dialog("Paused");
        }
        else if (state !== PAUSE) {
            return user.keyDown(e);
        }
        return true;
    }

    function loseLife() {
        setState(WAITING);
        user.loseLife();
        if (user.getLives() > 0) {
            startLevel();
        }
        else
            img_pause.src = "PLAY.png";
        map.draw(ctx);
    }

    function setState(nState) {
        state = nState;
        stateChanged = true;
    };

    function collided(user, ghost) {
        return (Math.sqrt(Math.pow(ghost.x - user.x, 2) +
            Math.pow(ghost.y - user.y, 2))) < 10;
    };

    function drawFooter() {

        var topLeft = (map.height * map.blockSize),
            textBase = topLeft + 17;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, topLeft, (map.width * map.blockSize), 30);

        ctx.fillStyle = "#faebd7";

        for (var i = 0, len = user.getLives(); i < len; i++) {
            ctx.fillStyle = "#FFE6FF";
            ctx.beginPath();
            ctx.moveTo(150 + (25 * i) + map.blockSize / 2,
                (topLeft + 1) + map.blockSize / 2);

            ctx.drawImage(img_heal, 150 + (25 * i) + map.blockSize / 2, topLeft + map.blockSize / 12);
            // ctx.arc(150 + (25 * i) + map.blockSize / 2,
            //         (topLeft+1) + map.blockSize / 2,
            //         map.blockSize / 2, Math.PI * 0.25, Math.PI * 1.75, false);
            ctx.fill();
        }

        ctx.fillStyle = !soundDisabled() ? "#00FF00" : "#FF0000";
        ctx.font = "bold 18px Comic Sans MS";
        ctx.fillText("♪", 10, textBase);

        ctx.fillStyle = "#faebd7";
        ctx.font = "bold 18px Comic Sans MS";
        ctx.fillText("Score: " + score, 30, textBase);
        textoLevelHell = "9 HELLS";
        ctx.fillStyle = "#ff0000";
        if (level == 1) {
            textoLevelHell = "Limbo";
        }
        else if (level == 2) {
            textoLevelHell = "Lust";
        }
        else if (level == 3) {
            textoLevelHell = "Gluttony";
        }
        else if (level == 4) {
            textoLevelHell = "Greed"
        }
        else if (level == 5) {
            textoLevelHell = "Wrath";
        }
        else if (level == 6) {
            textoLevelHell = "Heresy";
        }
        else if (level == 7) {
            textoLevelHell = "Violence";
        }
        else if (level == 8) {
            textoLevelHell = "Fraud";
        }
        else if (level == 9) {
            textoLevelHell = "Betrayal";
        }
        else if (level == 10) {
            textoLevelHell = "You won";
        }
        ctx.fillText(textoLevelHell, 260, textBase);
    }

    function redrawBlock(pos) {
        map.drawBlock(Math.floor(pos.y / 10), Math.floor(pos.x / 10), ctx);
        map.drawBlock(Math.ceil(pos.y / 10), Math.ceil(pos.x / 10), ctx);
    }

    function mainDraw() {

        var diff, u, y, i, len, nScore;

        ghostPos = [];

        for (i = 0, len = ghosts.length; i < len; i += 1) {
            ghostPos.push(ghosts[i].move(ctx));
        }
        u = user.move(ctx);
        y = botman.move(ctx);
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            redrawBlock(ghostPos[i].old);
        }
        redrawBlock(u.old);
        redrawBlock(y.old);
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            ghosts[i].draw(ctx);
        }
        user.draw(ctx);
        botman.draw(ctx);

        userPos = u["new"];

        for (i = 0, len = ghosts.length; i < len; i += 1) {
            if (collided(userPos, ghostPos[i]["new"])) {
                if (ghosts[i].isVunerable()) {
                    audio.play("eatghost");
                    ghosts[i].eat();
                    eatenCount += 1;
                    if (level==9) lives=4;
                    nScore = eatenCount * 50;
                    drawScore(nScore, ghostPos[i]);
                    user.addScore(nScore);
                    setState(EATEN_PAUSE);
                    timerStart = tick;
                }
                else if (ghosts[i].isDangerous()) {
                    audio.play("die");
                    setState(DYING);
                    timerStart = tick;
                }
            }
        }
    };

    function mainLoop() {

        var diff;

        if (state !== PAUSE) {
            ++tick;
        }

        map.drawPills(ctx);

        if (state === PLAYING) {
            mainDraw();
        }
        else if (state === WAITING && stateChanged) {
            stateChanged = false;
            map.draw(ctx);
            dialog("Abandon all hope, ye who enter here");
        }
        else if (state === EATEN_PAUSE &&
            (tick - timerStart) > (Hunter.FPS / 3)) {
            map.draw(ctx);
            setState(PLAYING);
        }
        else if (state === DYING) {
            if (tick - timerStart > (Hunter.FPS * 2)) {
                loseLife();
            }
            else {
                redrawBlock(userPos);
                for (i = 0, len = ghosts.length; i < len; i += 1) {
                    redrawBlock(ghostPos[i].old);
                    ghostPos.push(ghosts[i].draw(ctx));
                }
                user.drawDead(ctx, (tick - timerStart) / (Hunter.FPS * 2));
            }
        }
        else if (state === COUNTDOWN) {

            diff = 5 + Math.floor((timerStart - tick) / Hunter.FPS);

            if (diff === 0) {
                map.draw(ctx);
                setState(PLAYING);
            }
            else {
                if (diff !== lastTime) {
                    lastTime = diff;
                    map.draw(ctx);
                    if (level==1 && (diff<=4 && diff>3))
                        dialog("The portal of the faith that you embrace");
                    else if (level==1 && (diff<=3 && diff>=2))
                        dialog("Wakes up you crossed the Acheron");
                    else if (level==1 && (diff<2 && diff>=0))
                        dialog("Here is the first circle of the abyss");

                    else if (level==2 && (diff<=4 && diff>3))
                        dialog("Love, which in gentlest hearts");
                    else if (level==2 && (diff<=3 && diff>=2))
                        dialog("will soonest bloom. Love, which");
                    else if (level==2 && (diff<2 && diff>=0))
                        dialog("permits no loved one not to love");

                    else if (level==3 && (diff<=4 && diff>3))
                        dialog("Sightless and heedless of their neighbors");
                    else if (level==3 && (diff<=3 && diff>=2))
                        dialog("symbolizing the cold, selfish, and");
                    else if (level==3 && (diff<2 && diff>=0))
                        dialog("empty of their lives, only aim eat");

                    else if (level==4 && (diff<=4 && diff>3))
                        dialog("Why do you hoard? Why waste?");
                    else if (level==4 && (diff<=3 && diff>=2))
                        dialog("Here you lose points but with 5000");
                    else if (level==4 && (diff<2 && diff>=0))
                        dialog("You gain a bonus: your lives back");

                    else if (level==5 && (diff<=4 && diff>3))
                        dialog("That which had its tender and romantic");
                    else if (level==5 && (diff<=3 && diff>=2))
                        dialog("beginnings in the dalliance of indulged");
                    else if (level==5 && (diff<2 && diff>=0))
                        dialog("passion, savage self-frustration");

                    else if (level==6 && (diff<=4 && diff>3))
                        dialog("Who say: the soul dies with the body");
                    else if (level==6 && (diff<=3 && diff>=2))
                        dialog("Portal of the future is shut and it will");
                    else if (level==6 && (diff<2 && diff>=0))
                        dialog("no be possible for them to know anything");

                    else if (level==7 && (diff<=4 && diff>3))
                        dialog("As they wallowed in blood during their lives");
                    else if (level==7 && (diff<=3 && diff>=2))
                        dialog("So they are immersed in the blood forever");
                    else if (level==7 && (diff<2 && diff>=0))
                        dialog("each according to the degree of his guilt");

                    else if (level==8 && (diff<=4 && diff>3))
                        dialog("The horror of the punishment for thieves");
                    else if (level==8 && (diff<=3 && diff>=2))
                        dialog("is revealed gradually: just as they stole");
                    else if (level==8 && (diff<2 && diff>=0))
                        dialog("other people's substance in life");

                    else if (level==9 && (diff<=4 && diff>3))
                        dialog("The remorseless dead center of the ice");
                    else if (level==9 && (diff<=3 && diff>=2))
                        dialog("will serve to express their natures, so");
                    else if (level==9 && (diff<2 && diff>=0))
                        dialog("are they bound only by the unyielding ice");
                    else
                        dialog("game development course at herez.net");
                }
            }
        }

        drawFooter();
    }

    function eatenPill() {
        audio.play("eatpill");
        if (level == 6)
            lives = 4;
        else {
            timerStart = tick;
            eatenCount = 0;
            for (i = 0; i < ghosts.length; i += 1) {
                ghosts[i].makeEatable(ctx);
            }
        }
    };

    function completedLevel() {
        setState(WAITING);
        level += 1;
        map.reset();
        user.newLevel();
        startLevel();
    };

    function keyPress(e) {
        if (state !== WAITING && state !== PAUSE) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    function init(wrapper, root) {

        var i, len, ghost,
            blockSize = wrapper.offsetWidth / 19,
            canvas = document.createElement("canvas");

        canvas.setAttribute("width", (blockSize * 19) + "px");
        canvas.setAttribute("height", (blockSize * 22) + 30 + "px");

        wrapper.appendChild(canvas);

        ctx = canvas.getContext('2d');
   //     ctxBotman = canvas.getContext('2d');
        audio = new Hunter.Audio({
            "soundDisabled": soundDisabled
        });
        map = new Hunter.Map(blockSize);
        user = new Hunter.User({
            "completedLevel": completedLevel,
            "eatenPill": eatenPill
        }, map);
        botman = new Hunter.BotMan({
            "completedLevel": completedLevel,
            "eatenPill": eatenPill
        }, map);

        for (i = 0, len = ghostSpecs.length; i < len; i += 1) {
            ghost = new Hunter.Ghost({
                "getTick": getTick
            }, map, ghostSpecs[i]);
            ghosts.push(ghost);
        }

        map.draw(ctx);
        dialog("Loading ...");

        //     var extension = "mp3"; // Modernizr.audio.ogg ? 'ogg' : 'mp3';

        var audio_files = [
            //        ["start", root + "audio/die.mp3"], //"audio/i_see_you_voice_0.mp3"],
            ["die", root + "audio/die.mp3"],
            ["eatghost", root + "audio/eatghost.mp3"],
            ["eatpill", root + "audio/eatpill.mp3"]
            //    ["eating", root + "audio/eating.short." + extension],
            //    ["eating2", root + "audio/eating.short." + extension]
        ];

        load(audio_files, function() {
            loaded();
        });


    };

    function load(arr, callback) {

        if (arr.length === 0) {
            callback();
        }
        else {
            var x = arr.pop();
            audio.load(x[0], x[1], function() {
                load(arr, callback);
            });
        }
    };


    function pauseRestart() {
        if (level == 0 || lives <= 0) {
            startNewGame();
            (lives == 4) ? img_pause.src = "PAUSE.png": img_pause.src = "PLAY.png";
        }
        else if (state === PAUSE) {
            audio.resume();
            map.draw(ctx);
            setState(stored);
            img_pause.src = "PAUSE.png";
        }
        else {
            stored = state;
            setState(PAUSE);
            audio.pause();
            map.draw(ctx);
            dialog("Paused");
            img_pause.src = "PLAY.png";
        }
    }

    function soundOnOff() {
        audio.disableSound();
        localStorage["soundDisabled"] = !soundDisabled();
        if (soundDisabled())
            img_sound_on.src = "MUTE.png";
        else
            img_sound_on.src = "SOUND.png";
    }

    function loaded() {
        img_pause.addEventListener("click", pauseRestart, true);
        img_sound_on.addEventListener("click", soundOnOff, true);
        document.addEventListener("keydown", keyDown, true);
        document.addEventListener("keypress", keyPress, true);
        document.getElementById("div_hunter").addEventListener('touchstart', function(e) {
            startx = parseInt(e.changedTouches[0].clientX);
            starty = parseInt(e.changedTouches[0].clientY);
            e.preventDefault();
        }, false);
        document.getElementById("div_hunter").addEventListener('touchmove', function(e) {
            var x = parseInt(event.changedTouches[0].clientX);
            var y = parseInt(event.changedTouches[0].clientY);
            var eventObj = document.createEvent("Events");
            eventObj.initEvent("keydown", true, true);

            if (Math.abs(startx - x) > Math.abs(starty - y)) {
                if (startx - x > 0)
                    eventObj.keyCode = 37;
                else
                    eventObj.keyCode = 39;
            }
            else {
                if (starty - y > 0)
                    eventObj.keyCode = 38;
                else
                    eventObj.keyCode = 40;
            }
            document.dispatchEvent(eventObj);
        }, false);

        audio.disableSound();
        localStorage["soundDisabled"] = !soundDisabled();
        if (soundDisabled())
            img_sound_on.src = "MUTE.png";
        else
            img_sound_on.src = "SOUND.png";


        timer = window.setInterval(mainLoop, 1000 / Hunter.FPS);
    };

    return {
        "init": init
    };

}());

/* Human readable keyCode index */
var KEY = {
    'BACKSPACE': 8,
    'TAB': 9,
    'NUM_PAD_CLEAR': 12,
    'ENTER': 13,
    'SHIFT': 16,
    'CTRL': 17,
    'ALT': 18,
    'PAUSE': 19,
    'CAPS_LOCK': 20,
    'ESCAPE': 27,
    'SPACEBAR': 32,
    'PAGE_UP': 33,
    'PAGE_DOWN': 34,
    'END': 35,
    'HOME': 36,
    'ARROW_LEFT': 37,
    'ARROW_UP': 38,
    'ARROW_RIGHT': 39,
    'ARROW_DOWN': 40,
    'PRINT_SCREEN': 44,
    'INSERT': 45,
    'DELETE': 46,
    'SEMICOLON': 59,
    'WINDOWS_LEFT': 91,
    'WINDOWS_RIGHT': 92,
    'SELECT': 93,
    'NUM_PAD_ASTERISK': 106,
    'NUM_PAD_PLUS_SIGN': 107,
    'NUM_PAD_HYPHEN-MINUS': 109,
    'NUM_PAD_FULL_STOP': 110,
    'NUM_PAD_SOLIDUS': 111,
    'NUM_LOCK': 144,
    'SCROLL_LOCK': 145,
    'SEMICOLON': 186,
    'EQUALS_SIGN': 187,
    'COMMA': 188,
    'HYPHEN-MINUS': 189,
    'FULL_STOP': 190,
    'SOLIDUS': 191,
    'GRAVE_ACCENT': 192,
    'LEFT_SQUARE_BRACKET': 219,
    'REVERSE_SOLIDUS': 220,
    'RIGHT_SQUARE_BRACKET': 221,
    'APOSTROPHE': 222
};

(function() {
    /* 0 - 9 */
    for (var i = 48; i <= 57; i++) {
        KEY['' + (i - 48)] = i;
    }
    /* A - Z */
    for (i = 65; i <= 90; i++) {
        KEY['' + String.fromCharCode(i)] = i;
    }
    /* NUM_PAD_0 - NUM_PAD_9 */
    for (i = 96; i <= 105; i++) {
        KEY['NUM_PAD_' + (i - 96)] = i;
    }
    /* F1 - F12 */
    for (i = 112; i <= 123; i++) {
        KEY['F' + (i - 112 + 1)] = i;
    }
})();

Hunter.WALL = 0;
Hunter.BISCUIT = 1;
Hunter.EMPTY = 2;
Hunter.BLOCK = 3;
Hunter.PILL = 4;

Hunter.MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 4, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 4, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 2, 1, 1, 1, 0, 3, 3, 3, 0, 1, 1, 1, 2, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 4, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 4, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

Hunter.WALLS = [

    [{
        "move": [0, 9.5]
    }, {
        "line": [3, 9.5]
    }, {
        "curve": [3.5, 9.5, 3.5, 9]
    }, {
        "line": [3.5, 8]
    }, {
        "curve": [3.5, 7.5, 3, 7.5]
    }, {
        "line": [1, 7.5]
    }, {
        "curve": [0.5, 7.5, 0.5, 7]
    }, {
        "line": [0.5, 1]
    }, {
        "curve": [0.5, 0.5, 1, 0.5]
    }, {
        "line": [9, 0.5]
    }, {
        "curve": [9.5, 0.5, 9.5, 1]
    }, {
        "line": [9.5, 3.5]
    }],

    [{
        "move": [9.5, 1]
    }, {
        "curve": [9.5, 0.5, 10, 0.5]
    }, {
        "line": [18, 0.5]
    }, {
        "curve": [18.5, 0.5, 18.5, 1]
    }, {
        "line": [18.5, 7]
    }, {
        "curve": [18.5, 7.5, 18, 7.5]
    }, {
        "line": [16, 7.5]
    }, {
        "curve": [15.5, 7.5, 15.5, 8]
    }, {
        "line": [15.5, 9]
    }, {
        "curve": [15.5, 9.5, 16, 9.5]
    }, {
        "line": [19, 9.5]
    }],

    [{
        "move": [2.5, 5.5]
    }, {
        "line": [3.5, 5.5]
    }],

    [{
        "move": [3, 2.5]
    }, {
        "curve": [3.5, 2.5, 3.5, 3]
    }, {
        "curve": [3.5, 3.5, 3, 3.5]
    }, {
        "curve": [2.5, 3.5, 2.5, 3]
    }, {
        "curve": [2.5, 2.5, 3, 2.5]
    }],

    [{
        "move": [15.5, 5.5]
    }, {
        "line": [16.5, 5.5]
    }],

    [{
        "move": [16, 2.5]
    }, {
        "curve": [16.5, 2.5, 16.5, 3]
    }, {
        "curve": [16.5, 3.5, 16, 3.5]
    }, {
        "curve": [15.5, 3.5, 15.5, 3]
    }, {
        "curve": [15.5, 2.5, 16, 2.5]
    }],

    [{
        "move": [6, 2.5]
    }, {
        "line": [7, 2.5]
    }, {
        "curve": [7.5, 2.5, 7.5, 3]
    }, {
        "curve": [7.5, 3.5, 7, 3.5]
    }, {
        "line": [6, 3.5]
    }, {
        "curve": [5.5, 3.5, 5.5, 3]
    }, {
        "curve": [5.5, 2.5, 6, 2.5]
    }],

    [{
        "move": [12, 2.5]
    }, {
        "line": [13, 2.5]
    }, {
        "curve": [13.5, 2.5, 13.5, 3]
    }, {
        "curve": [13.5, 3.5, 13, 3.5]
    }, {
        "line": [12, 3.5]
    }, {
        "curve": [11.5, 3.5, 11.5, 3]
    }, {
        "curve": [11.5, 2.5, 12, 2.5]
    }],

    [{
        "move": [7.5, 5.5]
    }, {
        "line": [9, 5.5]
    }, {
        "curve": [9.5, 5.5, 9.5, 6]
    }, {
        "line": [9.5, 7.5]
    }],
    [{
        "move": [9.5, 6]
    }, {
        "curve": [9.5, 5.5, 10.5, 5.5]
    }, {
        "line": [11.5, 5.5]
    }],


    [{
        "move": [5.5, 5.5]
    }, {
        "line": [5.5, 7]
    }, {
        "curve": [5.5, 7.5, 6, 7.5]
    }, {
        "line": [7.5, 7.5]
    }],
    [{
        "move": [6, 7.5]
    }, {
        "curve": [5.5, 7.5, 5.5, 8]
    }, {
        "line": [5.5, 9.5]
    }],

    [{
        "move": [13.5, 5.5]
    }, {
        "line": [13.5, 7]
    }, {
        "curve": [13.5, 7.5, 13, 7.5]
    }, {
        "line": [11.5, 7.5]
    }],
    [{
        "move": [13, 7.5]
    }, {
        "curve": [13.5, 7.5, 13.5, 8]
    }, {
        "line": [13.5, 9.5]
    }],

    [{
        "move": [0, 11.5]
    }, {
        "line": [3, 11.5]
    }, {
        "curve": [3.5, 11.5, 3.5, 12]
    }, {
        "line": [3.5, 13]
    }, {
        "curve": [3.5, 13.5, 3, 13.5]
    }, {
        "line": [1, 13.5]
    }, {
        "curve": [0.5, 13.5, 0.5, 14]
    }, {
        "line": [0.5, 17]
    }, {
        "curve": [0.5, 17.5, 1, 17.5]
    }, {
        "line": [1.5, 17.5]
    }],
    [{
        "move": [1, 17.5]
    }, {
        "curve": [0.5, 17.5, 0.5, 18]
    }, {
        "line": [0.5, 21]
    }, {
        "curve": [0.5, 21.5, 1, 21.5]
    }, {
        "line": [18, 21.5]
    }, {
        "curve": [18.5, 21.5, 18.5, 21]
    }, {
        "line": [18.5, 18]
    }, {
        "curve": [18.5, 17.5, 18, 17.5]
    }, {
        "line": [17.5, 17.5]
    }],
    [{
        "move": [18, 17.5]
    }, {
        "curve": [18.5, 17.5, 18.5, 17]
    }, {
        "line": [18.5, 14]
    }, {
        "curve": [18.5, 13.5, 18, 13.5]
    }, {
        "line": [16, 13.5]
    }, {
        "curve": [15.5, 13.5, 15.5, 13]
    }, {
        "line": [15.5, 12]
    }, {
        "curve": [15.5, 11.5, 16, 11.5]
    }, {
        "line": [19, 11.5]
    }],

    [{
        "move": [5.5, 11.5]
    }, {
        "line": [5.5, 13.5]
    }],
    [{
        "move": [13.5, 11.5]
    }, {
        "line": [13.5, 13.5]
    }],

    [{
        "move": [2.5, 15.5]
    }, {
        "line": [3, 15.5]
    }, {
        "curve": [3.5, 15.5, 3.5, 16]
    }, {
        "line": [3.5, 17.5]
    }],
    [{
        "move": [16.5, 15.5]
    }, {
        "line": [16, 15.5]
    }, {
        "curve": [15.5, 15.5, 15.5, 16]
    }, {
        "line": [15.5, 17.5]
    }],

    [{
        "move": [5.5, 15.5]
    }, {
        "line": [7.5, 15.5]
    }],
    [{
        "move": [11.5, 15.5]
    }, {
        "line": [13.5, 15.5]
    }],

    [{
        "move": [2.5, 19.5]
    }, {
        "line": [5, 19.5]
    }, {
        "curve": [5.5, 19.5, 5.5, 19]
    }, {
        "line": [5.5, 17.5]
    }],
    [{
        "move": [5.5, 19]
    }, {
        "curve": [5.5, 19.5, 6, 19.5]
    }, {
        "line": [7.5, 19.5]
    }],

    [{
        "move": [11.5, 19.5]
    }, {
        "line": [13, 19.5]
    }, {
        "curve": [13.5, 19.5, 13.5, 19]
    }, {
        "line": [13.5, 17.5]
    }],
    [{
        "move": [13.5, 19]
    }, {
        "curve": [13.5, 19.5, 14, 19.5]
    }, {
        "line": [16.5, 19.5]
    }],

    [{
        "move": [7.5, 13.5]
    }, {
        "line": [9, 13.5]
    }, {
        "curve": [9.5, 13.5, 9.5, 14]
    }, {
        "line": [9.5, 15.5]
    }],
    [{
        "move": [9.5, 14]
    }, {
        "curve": [9.5, 13.5, 10, 13.5]
    }, {
        "line": [11.5, 13.5]
    }],

    [{
        "move": [7.5, 17.5]
    }, {
        "line": [9, 17.5]
    }, {
        "curve": [9.5, 17.5, 9.5, 18]
    }, {
        "line": [9.5, 19.5]
    }],
    [{
        "move": [9.5, 18]
    }, {
        "curve": [9.5, 17.5, 10, 17.5]
    }, {
        "line": [11.5, 17.5]
    }],

    [{
        "move": [8.5, 9.5]
    }, {
        "line": [8, 9.5]
    }, {
        "curve": [7.5, 9.5, 7.5, 10]
    }, {
        "line": [7.5, 11]
    }, {
        "curve": [7.5, 11.5, 8, 11.5]
    }, {
        "line": [11, 11.5]
    }, {
        "curve": [11.5, 11.5, 11.5, 11]
    }, {
        "line": [11.5, 10]
    }, {
        "curve": [11.5, 9.5, 11, 9.5]
    }, {
        "line": [10.5, 9.5]
    }]
];

Object.prototype.clone = function() {
    var i, newObj = (this instanceof Array) ? [] : {};
    for (i in this) {
        if (i === 'clone') {
            continue;
        }
        if (this[i] && typeof this[i] === "object") {
            newObj[i] = this[i].clone();
        }
        else {
            newObj[i] = this[i];
        }
    }
    return newObj;
};
