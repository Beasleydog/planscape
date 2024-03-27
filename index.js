var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Common = Matter.Common,
    Events = Matter.Events;
Matter.use(MatterAttractors);

var engine = Engine.create();

Common.setDecomp(decomp)

var mainBall = Bodies.circle(50, 50, 40, {
    friction: 0.2,
    restitution: .9,
    mass: 10,
});
mainBall.gameType = "mainBall";
const GOAL_DIMENSIONS = {
    width: 50,
    height: 50,
}
const COIN_DIMENSIONS = {
    width: 40,
    height: 40,
}
let distanceAwayToDetermineDifferentLine = 50;
let canHurtAgain = true;
var runner = Runner.create();
runner.isFixed = true;
Runner.run(runner, engine);

// var render = Render.create({
//     canvas: world,
//     engine: engine
// });
// Render.run(render);

const ARROW_IMAGE = new Image();
ARROW_IMAGE.src = "./assets/arrow.svg";


document.onkeydown = (e) => {
    if (e.key == " ") {
        if (GAME_STATE != "LEVEL") return;
        //Bring the mainball back to start
        killBall(false);
        setTimeout(() => {
            GAME_STATE = "BALL_FALLING";
            spawnGameBall();
            world.style.transform = "translate(-50%,-50%) scale(1.05)";
            setTimeout(() => {
                world.style.transform = "translate(-50%,-50%)";
            }, 200)
        }, 1)
    }
}

let currentLine = {
    drawing: false,
    start: {},
    points: []
}
let mousePos = { x: 0, y: 0 };
let CURRENT_LEVEL = 1;
let CURRENT_RESILIENCE = 0;
let CURRENT_INK = 0;
let CURRENT_MOUSE_MODE = "pen";
let GAME_STATE = "LEVEL";
let eraserBody = Bodies.circle(0, 0, 5, { isSensor: true });
const worldElement = document.getElementById("world");
worldElement.onmousedown = (e) => {
    if (GAME_STATE != "LEVEL") return;
    currentLine.drawing = true;
    console.log(translatePointToCanvasDimensions({
        x: e.clientX,
        y: e.clientY
    }))
}

let lastAddedPoint = { x: -100, y: -100 };
let displayDrawnPathPoints = [];

worldElement.onmousemove = (e) => {
    if (GAME_STATE != "LEVEL") return;

    mousePos = translatePointToCanvasDimensions({
        x: e.clientX - worldElement.getBoundingClientRect().x,
        y: e.clientY - worldElement.getBoundingClientRect().y
    });
    if (CURRENT_MOUSE_MODE == "pen") {
        if (currentLine.drawing) {
            let newPoint = translatePointToCanvasDimensions({
                x: e.clientX - worldElement.getBoundingClientRect().x,
                y: e.clientY - worldElement.getBoundingClientRect().y,
                inkUsed: 0
            });

            if (CURRENT_INK > 0) {
                displayDrawnPathPoints.push(newPoint);
            }

            if (distanceBetweenTwoPoints(lastAddedPoint, newPoint) > 50) {
                if (CURRENT_INK < 0) return;
                if (currentLine.points.length > 0) {
                    newPoint.inkUsed = distanceBetweenTwoPoints(newPoint, currentLine.points[currentLine.points.length - 1]) / 10;
                }
                if (currentLine.points.length > 0) {
                    setInk(CURRENT_INK - newPoint.inkUsed);
                }

                currentLine.points.push(newPoint);
                lastAddedPoint = newPoint;
            }
        }
    }
}
worldElement.onmouseup = (e) => {
    if (GAME_STATE != "LEVEL") return;

    try {
        if (CURRENT_INK > 0) {
            let newPoint = translatePointToCanvasDimensions({
                x: e.clientX - worldElement.getBoundingClientRect().x,
                y: e.clientY - worldElement.getBoundingClientRect().y,
                inkUsed: 0
            });
            if (currentLine.points.length > 0) {
                newPoint.inkUsed = distanceBetweenTwoPoints(newPoint, currentLine.points[currentLine.points.length - 1]) / 10;
            }
            currentLine.points.push(newPoint);
        }

        displayDrawnPathPoints = [];

        addLine(currentLine.points);
    } catch (e) { }
    currentLine.points = [];
    currentLine.drawing = false;
}

//Place ojects for first level
placeLevelObjects();

start.onclick = () => {
    introScreen.style.display = "none";
    gameScreen.style.display = "block";

    penButton.style.right = `${world.getBoundingClientRect().left + world.getBoundingClientRect().width + 50}px`;
    inkLeft.style.right = `${world.getBoundingClientRect().left + world.getBoundingClientRect().width + 50}px`;
    eraserButton.style.left = `${world.getBoundingClientRect().left + world.getBoundingClientRect().width + 50}px`;

}

penButton.onclick = () => {
    penButton.classList.add("buttonSelected");
    eraserButton.classList.remove("buttonSelected");
    CURRENT_MOUSE_MODE = "pen";
}
eraserButton.onclick = () => {
    CURRENT_MOUSE_MODE = "eraser";
    eraserButton.classList.add("buttonSelected");
    penButton.classList.remove("buttonSelected");
    Matter.Body.setPosition(eraserBody, translatePointToCanvasDimensions({
        x: -10,
        y: -10
    }));
}

function setInk(ink) {
    CURRENT_INK = Math.min(ink, getLevelData(CURRENT_LEVEL).startingInk);
    inkLeft.innerText = Math.max(Math.round(CURRENT_INK), 0);
}

function spawnGameBall() {
    Composite.remove(engine.world, mainBall);
    Matter.Body.setPosition(mainBall, getLevelData(CURRENT_LEVEL).spawn);
    Matter.Body.setVelocity(mainBall, { x: 0, y: 0 });
    Composite.add(engine.world, mainBall);
}

function getLevelData(number) {
    return window.levelsData.filter((level) => level.number == number)[0];
}

function addLine(points) {
    let lineId = Math.random();
    points.forEach((point, i) => {
        let pointDistance = Math.sqrt(Math.pow(points[i + 1].x - point.x, 2) + Math.pow(points[i + 1].y - point.y, 2));
        let line = Matter.Bodies.rectangle(point.x, point.y, pointDistance, 2, {
            chamfer: { radius: 1 },
            friction: 0
        });

        line.gameType = "drawnPath";
        line.lineVertices = [{ x: point.x, y: point.y }, { x: points[i + 1].x, y: points[i + 1].y }];
        line.inkUsed = points[i + 1].inkUsed;
        line.lineId = lineId;
        Matter.Body.rotate(line, Math.atan2(points[i + 1].y - point.y, points[i + 1].x - point.x));
        Matter.Body.setStatic(line, true);


        if (line.angle >= 1.5) {
            Matter.Body.setPosition(line, { x: point.x + (line.bounds.min.x - point.x), y: point.y + (line.bounds.max.y - point.y) });
        } else if (line.angle >= 0) {
            Matter.Body.setPosition(line, { x: point.x + (line.bounds.max.x - point.x), y: point.y + (line.bounds.max.y - point.y) });
        } else if (line.angle >= -1.5) {
            Matter.Body.setPosition(line, { x: point.x + (line.bounds.max.x - point.x), y: point.y + (line.bounds.min.y - point.y) });
        } else {
            Matter.Body.setPosition(line, { x: point.x + (line.bounds.min.x - point.x), y: point.y + (line.bounds.min.y - point.y) });
        }

        Composite.add(engine.world, [line], {
            render: {
                fillStyle: 'transparent',
                lineWidth: 6
            }
        });
    })
}

function removeDuplicates(a) {
    //Remove duplicates from array a
    var clean = [];
    a.forEach((point, i, a) => {
        if (!clean.map((x) => JSON.stringify(x)).includes(JSON.stringify(point))) {
            clean.push(point);
        }
    })
    return clean;
}

function translatePointToCanvasDimensions(point) {
    return {
        ...point,
        x: point.x / worldElement.getBoundingClientRect().width * 800,
        y: point.y / worldElement.getBoundingClientRect().height * 1080
    }
}

function distanceBetweenTwoPoints(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function killBall(particles) {
    GAME_STATE = "LEVEL";
    canHurtAgain = true;
    if (particles != false) {
        spawnParticles(mainBall.position.x, mainBall.position.y - 10, mainBall.circleRadius, "death");
    }
    Matter.Body.setPosition(mainBall, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(mainBall, 0);
    Matter.Body.setAngle(mainBall, 0);

    Composite.remove(engine.world, mainBall);
    CURRENT_RESILIENCE = getLevelData(CURRENT_LEVEL).startingResilience;

    removeAllConsumables();
    placeLevelObjects(true);
}

function removeAllConsumables() {
    Composite.allBodies(engine.world).forEach((body) => {
        if (body.consumable) Composite.remove(engine.world, body);
    })
}
function placeLevelObjects(consumablesOnly) {
    Composite.remove(engine.world, eraserBody);
    Composite.addBody(engine.world, eraserBody);

    let levelData = getLevelData(CURRENT_LEVEL);
    CURRENT_RESILIENCE = levelData.startingResilience;
    if (!consumablesOnly) {
        setInk(levelData.startingInk);
    }
    levelData.objects.forEach((object) => {
        if (consumablesOnly && !object.consumable) return
        switch (object.type) {
            case "rectangle":
                Composite.add(engine.world, Bodies.rectangle(object.x + object.width / 2, object.y + object.height / 2, object.width, object.height, { isStatic: true, chamfer: { radius: 10 }, gameType: "obstacle", angle: object.angle ? object.angle * (Math.PI / 180) : 0, specialProps: object.specialProps }));
                break;
            case "lava":
                Composite.add(engine.world, Bodies.rectangle(object.x + object.width / 2, object.y + object.height / 2, object.width, object.height, { isStatic: true, chamfer: { radius: 10 }, gameType: "lava", angle: object.angle ? object.angle * (Math.PI / 180) : 0, specialProps: object.specialProps }));
                break;
            case "booster":
                Composite.add(engine.world, Bodies.rectangle(object.x + object.width / 2, object.y + object.height / 2, object.width, object.height, { isStatic: true, chamfer: { radius: 10 }, gameType: "booster", angle: object.angle ? object.angle * (Math.PI / 180) : 0, specialProps: object.specialProps, width: object.width, height: object.height }));
                break;
            case "booster":
                Composite.add(engine.world, Bodies.rectangle(object.x + object.width / 2, object.y + object.height / 2, object.width, object.height, { isStatic: true, chamfer: { radius: 10 }, gameType: "booster", angle: object.angle ? object.angle * (Math.PI / 180) : 0, specialProps: object.specialProps, width: object.width, height: object.height }));
                break;
            case "coin":
                Composite.add(engine.world, Bodies.circle(object.x + COIN_DIMENSIONS.width / 2, object.y + COIN_DIMENSIONS.height / 2, COIN_DIMENSIONS.width, { isStatic: true, isSensor: true, gameType: "coin", specialProps: object.specialProps, consumable: true }));
                break;
        }
    });
    if (!consumablesOnly) {
        Composite.add(engine.world, Bodies.circle(levelData.goal.x + GOAL_DIMENSIONS.width / 2, levelData.goal.y + GOAL_DIMENSIONS.height / 2, GOAL_DIMENSIONS.width, {
            isSensor: true, isStatic: true, gameType: "goal", plugin: {
                attractors: [
                    function (bodyA, bodyB) {
                        if (!(bodyB.gameType == "mainBall" && GAME_STATE == "SUCKING_BALL")) return;
                        return {
                            x: (bodyA.position.x - bodyB.position.x) * 0.0015,
                            y: (bodyA.position.y - bodyB.position.y) * 0.0015,
                        };
                    }
                ]
            }
        }))
    }
}

function cleanUpLevelExcalidraw(data) {
    let spawnPoint = data.elements.filter((x) => {
        return x.type == "diamond" && x.backgroundColor == "transparent"
    })[0]
    let goalPoint = data.elements.filter((x) => {
        return x.type == "diamond" && x.backgroundColor == "#fd7e14"
    })[0]
    prompt("", `window.levelsData.push(${JSON.stringify({
        number: 0,
        startingResilience: 0,
        startingInk: 0,
        spawn: { x: spawnPoint.x, y: spawnPoint.y },
        goal: { x: goalPoint.x, y: goalPoint.y },
        objects:
            data.elements.filter((x) => x.type != "diamond" && (x.width != 800 && x.height != 1800)).map((x) => {
                return {
                    type: x.type,
                    x: x.x,
                    y: x.y,
                    width: x.width,
                    height: x.height,
                    angle: x.angle
                }
            })

    })})`);
}

