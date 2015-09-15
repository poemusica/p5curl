////////////////////////////////////////////////////////////////////////////////
// CURL NOISE SKETCH
var sketch = function (s) {
    var winW, winH,
        psys;
    ////////////////////////////////////////////////////////////////////////////
    // Sets up sketch.
    s.setup = function () {
        s.colorMode(s.HSB, 360, 100, 100, 1);
        winW = document.getElementsByTagName("html")[0].clientWidth;
        winH = document.getElementsByTagName("html")[0].clientHeight;
        s.createCanvas(winW, winH);
        psys = particleSystem(s.createVector(winW/2, winH/2));
    }

    ////////////////////////////////////////////////////////////////////////////
    // Draws.
    s.draw = function () {
        s.background(0);
        showField();
        psys.run();
    }
    ////////////////////////////////////////////////////////////////////////////
    // Window resizing logic
    s.windowResized = function () {
        winW = document.getElementsByTagName("html")[0].clientWidth;
        winH = document.getElementsByTagName("html")[0].clientHeight;
        s.resizeCanvas(winW, winH);
        psys.origin = s.createVector(winW/2, winH/2);
    }
    ////////////////////////////////////////////////////////////////////////////
    // Defines particle.
    function particle (l, _ageRate) {
        return {
            loc: l.copy(),
            vel: s.createVector(),
            lifespan: 200,
            ageRate: _ageRate,
            // radius
            r: s.random(2, 12),
            // color
            c: s.createVector(0, 0, 0),
            isDead: function () {
                if (this.lifespan <= 0) {
                    return true;
                } return false;
            },
            update: function () {
                var bucketX = this.loc.x - this.loc.x % 40,
                    bucketY = this.loc.y - this.loc.y % 40,
                    curlv = curl(bucketX, bucketY, s.frameCount),
                    v = makeEdges(curlv, bucketX, bucketY);
                    // v = repel(curlv, bucketX, bucketY);
                v = v.div(this.r/20);
                v.mult(2);
                // this.vel = p5.Vector.lerp(this.vel, v, 0.8);
                this.vel = v;
                this.vel.limit(6);
                this.loc.add(this.vel);
                this.lifespan -= this.ageRate;
            },
            wrap: function () {
                if (this.loc.x > winW + this.r) {
                    this.loc.x = 0;
                }
                if (this.loc.x < -this.r) {
                    this.loc.x = winW;
                }
                if (this.loc.y > winH + this.r) {
                    this.loc.y = 0;
                }
                if (this.loc.y < -this.r) {
                    this.loc.y = winH;
                }
            },
            display: function () {
                s.push();
                s.translate(this.loc.x, this.loc.y);
                s.noStroke();
                s.fill(s.degrees(this.vel.heading()) + 180, 100, 100, this.lifespan/200);
                s.ellipse(0, 0, this.r * 2, this.r * 2);
                s.pop();
            },
            run: function () {
                this.update();
                this.wrap();
                this.display();
            }
        }
    }
    ////////////////////////////////////////////////////////////////////////////
    // Defines particle system.
    function particleSystem (l) {
        return {
            origin: l.copy(),
            maxPop: 200,
            particles: [],
            addParticle: function () {
                var p = particle(this.origin, 20/this.maxPop);
                this.particles.push(p);
            },
            run: function () {
                if (s.frameCount % 10 === 0) {
                    this.addParticle();
                }
                if (s.frameCount % 11 === 0) {
                    var v;
                    v = this.particles[this.particles.length - 1].vel.copy();
                    v.mult(5);
                    this.origin = p5.Vector.sub(this.origin, v);
                }
                for (var i = this.particles.length-1; i >= 0; i--) {
                    var p = this.particles[i];
                    p.run();
                    if (p.isDead()) {
                        this.particles.splice(i, 1);
                    }
                }
            }
        }
    }
    ////////////////////////////////////////////////////////////////////////////
    // Computes curl of vector field. Returns vector.
    function showField() {
        var step = 40;
            xoff = 0; //(winW % step) / 2,
            yoff = 0; //(winH % step) / 2;
        s.push();
        // s.translate(xoff, yoff);
        // for (var x = step; x < winW - step; x += step) {
        for (var x = 0; x < winW; x += step) {
            // for (var y = step; y < winH - step; y += step) {
            for (var y = 0; y < winH; y += step) {
                var curlv = curl(x, y, s.frameCount),
                    v = makeEdges(curlv, x, y);
                    // v = repel(edgev, x, y);
                v.setMag(step/2);
                // Add 180 to exclude negative numbers.
                s.noFill();
                s.strokeWeight(6);
                s.stroke(s.degrees(v.heading()) + 180, 100, 100);
                s.line(x, y, x + v.x, y + v.y);
                s.ellipse(x, y, 1, 1);
            };
        };
        s.pop();
    }
    ////////////////////////////////////////////////////////////////////////////
    // Disrupts flow based on mouse position.
    function repel(curlv, x, y) {
        var dir, repelv, dist, v;
        if (s.mouseIsPressed) {
            dir = 180;
        } else { dir = 0; }
        curlv.rotate(dir);
        repelv = p5.Vector.sub(s.createVector(x, y),
                               s.createVector(s.mouseX, s.mouseY));
        dist = repelv.mag();
        curlv.setMag(1);
        repelv.setMag(100/dist);
        v = p5.Vector.add(curlv, repelv);
        return v;
    }
    ////////////////////////////////////////////////////////////////////////////
    // Modify velocity vectors to account for boundaries.
    function makeEdges(curlv, x, y) {
        var v = s.createVector(),
            midX = winW/2,
            midY = winH/2,
            amtX, amtY,
            dirX, dirY;
        if (x < midX) { dirX = 1; amtX = winW/s.sq(x + 1); }//s.map(x, 0, midX, 1, 0); }
        else { dirX = -1; amtX = winW/s.sq(winW - (x -1)); }// s.map(x, midX, winW, 0, 1); }
        if ( y < midY) { dirY = 1; amtY = winH/s.sq(y + 1); }//s.map(y, 0, midY, 1, 0); }
        else { dirY = -1; amtY = winH/s.sq(winH - (y - 1)); }//s.map(y, midY, winH, 0, 1); }
        v.x = s.lerp(curlv.x, dirX, amtX);
        v.y = s.lerp(curlv.y, dirY, amtY);
        return v;
    }
    ////////////////////////////////////////////////////////////////////////////
    // Computes curl of vector field. Returns vector.
    function curl(x, y, t) {
        var epsilon = 0.001,
            noiseScale = 0.0005,
            // Noise produces weird effects at edges. Offset to avoid edge.
            noiseOffset = 100,
            tScale = 0.001,
            n1, n2,
            a, b;
        // Use finite differences technique to approximate derivatives.
        // Approximate rate of change in x wrt y.
        n1 = s.noise((x * noiseScale) + noiseOffset,
                     (y * noiseScale) + epsilon + noiseOffset,
                     t * tScale);
        n2 = s.noise((x * noiseScale) + noiseOffset,
                     (y * noiseScale) - epsilon + noiseOffset,
                     t * tScale);
        a = (n1 - n2) / (2 * epsilon);
        // Approximate rate of change in y wrt x.
        n1 = s.noise((x * noiseScale) + epsilon + noiseOffset,
                     (y * noiseScale) + noiseOffset,
                     t * tScale);
        n2 = s.noise((x * noiseScale) - epsilon + noiseOffset,
                     (y * noiseScale) + noiseOffset,
                     t * tScale);
        b = (n1 - n2) / (2 * epsilon);
        return new p5.Vector(a, -b);
    }
}
////////////////////////////////////////////////////////////////////////////////
// START
// Creates canvas running 'sketch' as child of the element with id 'p5-sketch'.
var p5sketch = new p5(sketch, 'p5-sketch');