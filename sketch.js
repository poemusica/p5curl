// Defines the sketch.
var sketch = function (s) {
    // Sketch globals.
    var ps;
    var field;

    // Preloads assets using p5 *load functions.
    s.preload = function () {
    }

    s.setup = function () {
        s.createCanvas(s.windowWidth, s.windowHeight);
        field = flowField();
        field.init();
        psys = particleSystem(s.createVector(s.windowWidth/2, s.windowHeight/2));
    }

    s.draw = function () {
        if (!s.mouseIsPressed) {
            s.background(255);
            field.run();
            if (psys.particles.length) {
                o = psys.particles[psys.particles.length-1].loc.copy();
                psys.origin.set(o);
            }
            psys.run();
        }
    }

    s.windowResized = function () {
        s.resizeCanvas(s.windowWidth, s.windowHeight);
        field.init();
    }

    // Particle object.
    function particle (l) {
        return {
            loc: l.copy(),
            vel: s.createVector(),
            acc: p5.Vector.random2D(),
            lifespan: 200,
            maxSpeed: 5,
            r: s.random(2, 12),
            c: s.createVector(s.random(0, 255), s.map(s.noise(this.r), 0, 1, 0, 255), s.random(150, 255)),
            applyForce: function (force) {
                var f = force.copy();
                this.acc.add(f);
            },
            isDead: function () {
                if (this.lifespan <= 0) {
                    return true;
                } return false;
            },
            update: function () {
                this.applyForce(field.lookup(this.loc));
                this.vel.add(this.acc);
                this.vel.limit(this.maxSpeed);
                this.loc.add(this.vel);
                this.acc.mult(0);
                this.lifespan -= 1;
            },
            wrap: function () {
                if (this.loc.x > s.windowWidth + this.r) {
                    this.loc.x = 0;
                }
                if (this.loc.x < -this.r) {
                    this.loc.x = s.windowWidth
                }
                if (this.loc.y > s.windowHeight + this.r) {
                    this.loc.y = 0;
                }
                if (this.loc.y < -this.r) {
                    this.loc.y = s.windowHeight;
                }
            },
            display: function () {
                s.push();
                s.translate(this.loc.x, this.loc.y);
                s.noStroke();
                s.fill(this.c.x, this.c.y, this.c.z, this.lifespan);
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

    // Particle system.
    function particleSystem (l) {
        return {
            origin: l.copy(),
            lifespan: 300,
            particles: [],
            addParticle: function () {
                this.particles.push(particle(this.origin));
            },
            run: function () {
                if (this.lifespan > 0 && s.frameCount % 10 === 0) {
                    this.addParticle();
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

    // Flow field.
    function flowField() {
        return {
            resolution: 40,
            rows: s.floor(s.windowHeight/this.resolution),
            cols: s.floor(s.windowWidth/this.resolution),
            xmargin: (s.windowWidth - (this.cols * this.resolution) + this.resolution) / 2,
            ymargin: (s.windowHeight - (this.rows * this.resolution) + this.resolution) / 2,
            field: [],
            init: function () {
                this.rows = s.floor(s.windowHeight/this.resolution);
                this.cols = s.floor(s.windowWidth/this.resolution);
                this.xmargin = (s.windowWidth - (this.cols * this.resolution) + this.resolution) / 2;
                this.ymargin = (s.windowHeight - (this.rows * this.resolution) + this.resolution) / 2;
                this.field = [];
                for (var r = 0; r < this.rows; r++) {
                    this.field.push([]);
                    for (var c = 0; c < this.cols; c++) {
                        this.field[r].push(s.createVector(1, 0));
                    }
                }
                this.update();
            },
            lookup: function (v) {
                var row = s.constrain(s.round((v.y - this.ymargin)/this.resolution), 0, this.rows - 1);
                var col = s.constrain(s.round((v.x - this.xmargin)/this.resolution), 0, this.cols - 1);
                return this.field[row][col].copy();
            },
            update: function () {
                var ystep = 0;
                for (var r = 0; r < this.rows; r++) {
                    var xstep = 0;
                    for (var c = 0; c < this.cols; c++) {
                        var theta = s.map(s.noise(xstep, ystep, s.frameCount/100), 0, 1, s.radians(1), s.TWO_PI);
                        this.field[r][c] = s.createVector(1, 0);
                        this.field[r][c].rotate(theta);
                        xstep += 0.3;
                    }
                    ystep += 0.3;
                }
            },
            display: function () {
                var size = this.resolution * 0.75;
                for (var r = 0; r < this.rows; r++) {
                    for (var c = 0; c < this.cols; c++) {
                        s.stroke(175);
                        s.fill(175);
                        s.push();
                        s.translate(this.resolution * c +  this.xmargin, this.resolution * r + this.ymargin);
                        s.rotate(this.field[r][c].heading());
                        // cell center
                        s.ellipse(0, 0, 5, 5);
                        // arrow body
                        s.line(-size/2, 0, size/2, 0);
                        s.translate(size/2, 0);
                        // arrow head 1
                        s.push();
                        s.rotate(-s.PI * 5/6);
                        s.line(0, 0, size/3, 0);
                        s.pop();
                        // arrow head 2
                        s.push();
                        s.rotate(s.PI * 5/6);
                        s.line(0, 0, size/3, 0);
                        s.pop();
                        s.pop();
                    }
                }
            },
            run: function() {
                this.update();
                this.display();
            }
        }
    }

}

// Creates a new canvas running 'sketch' as a child of the element with id 'p5-sketch'.
var p5sketch = new p5(sketch, 'p5-sketch');