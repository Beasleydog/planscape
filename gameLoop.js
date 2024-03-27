let world = document.getElementById("world");
let context = world.getContext("2d");
const LIGHT_BLACK = "#272a2a";
let ballColor = "#8ae360";
let Y_OFFSET = 0;


(function gameLoop() {
    render();

    Matter.Body.setPosition(eraserBody, { x: mousePos.x, y: mousePos.y });
    Matter.Body.setVelocity(eraserBody, { x: 0, y: 0 });


    // If ball falls below screen, destroy it
    if (mainBall.position.y > 1080) {
        killBall();
    }

    if (ballStationary() && GAME_STATE == "BALL_FALLING") {
        setTimeout(() => {
            if (ballStationary() && GAME_STATE == "BALL_FALLING") {
                killBall();
            }
        }, 2000);
    }

    if (Composite.allBodies(engine.world).filter((x) => {
        return x.gameType == "drawnPath"
    }).filter((x) => {
        return (
            distanceBetweenTwoPoints(mainBall.position, x.lineVertices[0]) < distanceAwayToDetermineDifferentLine
            ||
            distanceBetweenTwoPoints(mainBall.position, x.lineVertices[1]) < distanceAwayToDetermineDifferentLine
            ||
            distanceBetweenTwoPoints(mainBall.position, x.position) < distanceAwayToDetermineDifferentLine
        )
    }).length == 0) {
        canHurtAgain = true;
    }


    window.requestAnimationFrame(gameLoop);
})();

function ballStationary() {
    return (Math.abs(mainBall.velocity.x) < 0.1 && Math.abs(mainBall.velocity.y) < 0.1)
}

Events.on(engine, "collisionStart", handleCollision);
function handleCollision(collision) {
    var bodyA = collision.pairs[0].bodyA;
    var bodyB = collision.pairs[0].bodyB;
    if (bodyA == mainBall || bodyB == mainBall) {
        let otherObject = bodyA == mainBall ? bodyB : bodyA;
        if (otherObject.gameType == "drawnPath") {
            if (canHurtAgain) {
                CURRENT_RESILIENCE--;
                canHurtAgain = false;

                if (CURRENT_RESILIENCE == -1) {
                    killBall();
                }
            }
        }
        if (otherObject.gameType == "goal") {
            if (GAME_STATE != "BALL_FALLING") return;
            GAME_STATE = "SUCKING_BALL";
            // Matter.Body.setInertia(mainBall, 1);
            // Matter.Body.setMass(mainBall, 8);
            setTimeout(() => {
                if (CURRENT_LEVEL == 6) {
                    gameScreen.style.display = "none";
                    gameOverScreen.style.display = "flex";
                }
                CURRENT_LEVEL++;
                GAME_STATE = "LEVEL"
                Composite.remove(engine.world, Composite.allBodies(engine.world));
                placeLevelObjects();
            }, 3000);
        }
        if (otherObject.gameType == "lava") {
            killBall();
        }
        if (otherObject.gameType == "booster") {
            setTimeout(() => {
                Matter.Body.applyForce(mainBall, mainBall.position, otherObject.specialProps.force);
            }, 1);
        }
        if (otherObject.gameType == "coin") {
            CURRENT_RESILIENCE++;
            Composite.remove(engine.world, otherObject);
            spawnParticles(otherObject.position.x, otherObject.position.y, otherObject.circleRadius, "coin");
        }
    }
    if (bodyA == eraserBody || bodyB == eraserBody) {
        let otherObject = bodyA == eraserBody ? bodyB : bodyA;
        if (otherObject.gameType != "drawnPath") return;
        if (CURRENT_MOUSE_MODE == "eraser") {
            setInk(CURRENT_INK + otherObject.inkUsed);
            Composite.remove(engine.world, otherObject);
        }
    }

}


function render() {
    var bodies = Composite.allBodies(engine.world);


    context.clearRect(0, 0, world.width, world.height);

    //Display the display path that the user is drawing. This will path will be turned into simplified line objects on mouseup
    if (displayDrawnPathPoints[0]) {
        context.beginPath();
        context.moveTo(displayDrawnPathPoints[0].x, displayDrawnPathPoints[0].y);
        displayDrawnPathPoints.forEach((point) => {
            context.lineTo(point.x, point.y);
        });
        context.lineCap = 'round';
        context.lineWidth = 9;
        context.strokeStyle = '#e2e2e2';
        context.stroke();
        context.closePath();
    }

    if (!Composite.allBodies(engine.world).includes(mainBall)) {
        //Draw ball preview if it is not current in the world
        context.globalAlpha = 0.2;
        context.fillStyle = ballColor;
        context.beginPath();
        context.arc(getLevelData(CURRENT_LEVEL).spawn.x, getLevelData(CURRENT_LEVEL).spawn.y, mainBall.circleRadius, 0, 2 * Math.PI);
        context.fill();
        context.globalAlpha = 1;
    }

    for (var i = 0; i < bodies.length; i += 1) {

        switch (bodies[i].gameType) {
            case "mainBall":
                context.beginPath();
                context.arc(bodies[i].position.x, bodies[i].position.y, bodies[i].circleRadius, 0, 2 * Math.PI);
                context.fillStyle = ballColor;
                context.shadowBlur = "2";
                context.shadowColor = "#8ae360";
                context.fill();

                context.beginPath();
                context.save();
                context.resetTransform();
                context.translate(bodies[i].position.x, bodies[i].position.y);
                context.fillStyle = "#6ab04a";
                context.rotate(bodies[i].angle);
                let rectSize = 1.3;
                context.fillRect(0 - (bodies[i].circleRadius * rectSize) / 2, 0 - (bodies[i].circleRadius * rectSize) / 2, (bodies[i].circleRadius * rectSize), (bodies[i].circleRadius * rectSize));
                context.restore();

                context.beginPath();
                var fontSize = 40;
                context.font = `${fontSize}px tech`;
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillStyle = "white";
                context.fillText(CURRENT_RESILIENCE, bodies[i].position.x, bodies[i].position.y);
                break;
            case "coin":

                context.beginPath();
                context.arc(bodies[i].position.x, bodies[i].position.y, bodies[i].circleRadius, 0, 2 * Math.PI);
                context.fillStyle = "#ffe236";
                context.shadowBlur = "2";
                context.shadowColor = "#ffe236";
                context.fill();
                context.fillStyle = "#b29e25";
                context.font = "40px tech";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText("+R", bodies[i].position.x, bodies[i].position.y);
                break;
            case "booster":
                context.beginPath();
                context.fillStyle = "#ab97d2";
                drawViaVertices(bodies[i], false);
                context.fill();
                context.stroke();

                context.beginPath();
                context.fillStyle = "white";
                var fontSize = (bodies[i].width > bodies[i].height ? bodies[i].height : bodies[i].width) - 12;
                context.font = `${fontSize}px serif`;
                context.save();
                context.translate(bodies[i].position.x, bodies[i].position.y);
                context.rotate((Math.atan(bodies[i].specialProps.force.y / bodies[i].specialProps.force.x)));
                let arrowX = 0 - fontSize / 2;
                let arrowY = 0 - fontSize / 2;
                context.drawImage(ARROW_IMAGE, arrowX, arrowY, fontSize, fontSize);
                context.restore();
                break;
            case "drawnPath":
                context.beginPath();
                context.lineCap = 'round';
                context.strokeStyle = '#e2e2e2';
                context.fillStyle = "#e2e2e2";
                drawViaVertices(bodies[i], true, bodies[i].lineId);
                context.stroke();
                context.closePath();
                break;
            case "particle":
                context.beginPath();
                context.arc(bodies[i].position.x, bodies[i].position.y, bodies[i].circleRadius, 0, 2 * Math.PI);
                switch (bodies[i].particleType) {
                    case "death":
                        context.fillStyle = "#8ae360";
                        break;
                    case "coin":
                        context.fillStyle = "#ffe236";
                        break;

                }
                context.fill();
                break;
            case "lava":
                context.fillStyle = "#ffae36";
                drawViaVertices(bodies[i]);
                context.fill();
                break;
            case "goal":
                context.beginPath();
                context.arc(bodies[i].position.x, bodies[i].position.y, bodies[i].circleRadius, 0, 2 * Math.PI);
                context.fillStyle = "#40a4f4";
                context.fill();
                context.closePath();
                context.beginPath();
                context.strokeWidth = 1;
                context.strokeStyle = "white";
                for (var l = 0; l < 160; l++) {
                    let angle = 0.1 * l;
                    x = bodies[i].position.x + (3 + 3 * angle) * Math.cos(angle);
                    y = bodies[i].position.y + (3 + 3 * angle) * Math.sin(angle);
                    context.lineTo(x, y);
                }
                context.stroke();
                break;
            default:
                context.lineWidth = 1;
                context.strokeStyle = 'gray';
                context.shadowColor = LIGHT_BLACK;
                context.fillStyle = LIGHT_BLACK;
                drawViaVertices(bodies[i], false);
                context.fill();
                break;
        }
    }

}
function drawViaVertices(body, isPath, lineId) {
    var vertices = body.vertices;
    // if (isPath && lineId) {
    //     let allVertices = [];
    //     let endPoints = [];

    //     Composite.allBodies(engine.world).forEach(body => {
    //         if (body.gameType == "drawnPath" && body.lineId == lineId) {
    //             allVertices = allVertices.concat(body.lineVertices);
    //             endPoints.push(body.lineVertices);
    //         }
    //     });

    //     context.fillStyle = "#7c7c7c";
    //     context.beginPath();
    // }

    context.beginPath();
    context.lineWidth = 9;
    if (body.lineVertices) {
        verticies = body.lineVertices;
        context.lineCap = "round";
        context.moveTo(vertices[0].x, vertices[0].y);
        context.lineTo(vertices[1].body.lineVertices[1].x, vertices[1].body.lineVertices[1].y);
        context.stroke();
    } else {
        context.moveTo(vertices[0].x, vertices[0].y);

        for (var j = 1; j < vertices.length; j += 1) {
            context.lineTo(vertices[j].x, vertices[j].y);
        }
    }
    context.closePath();
}
function spawnParticles(x, y, radius, type) {
    for (var i = 0; i < 10; i++) {
        let distance = radius * .8;
        let particleX = x - (skewedRandom() * (distance * 2) - distance);
        let particleY = y - (skewedRandom() * (distance * 2) - distance);

        let particle = Matter.Bodies.circle(particleX, particleY, 4, {
            density: 0.00001,
            isSensor: true
        });

        setTimeout(() => {
            Composite.remove(engine.world, particle);
        }, 500 + Math.random() * 500);

        particle.gameType = `particle`;
        particle.particleType = type;
        let xDirection = (Math.abs((particleX - x)) / (particleX - x));
        Matter.Body.setVelocity(particle, { x: (Math.random() * 3 - 1.5) * xDirection, y: (Math.random() * -3 + -3) });
        Composite.add(engine.world, particle);

    }
}

function skewedRandom() {
    const a = Math.pow(Math.random(), 2);
    if (Math.random() < 0.5) {
        return a;
    }
    return 1 - a;
}