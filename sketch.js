// Defines the sketch.
var sketch = function (s) {
    // Sketch globals.
    var winW, winH,
        windowDepth,
        ps,
        nearField,
        farField;
    ////////////////////////////////////////////////////////////////////////////
    // Preloads assets using p5 *load functions.
    s.preload = function () {
    }
    ////////////////////////////////////////////////////////////////////////////
    // Sets up sketch.
    s.setup = function () {
        winW = document.getElementsByTagName("html")[0].clientWidth;
        winH = document.getElementsByTagName("html")[0].clientHeight;
        s.createCanvas(winW, winH);
        windowDepth = s.min(winW, winH)/2;
        nearField = flowField(0, 100, 1);
        nearField.init();
        farField = flowField(100, 100, -1);
        farField.init();
        psys = particleSystem(s.createVector(winW/2, winH/2, windowDepth/2));
    }

    ////////////////////////////////////////////////////////////////////////////
    // Draws.
    s.draw = function () {
        s.background(255);
        // s.background(255, 90);
        if (s.mouseIsPressed) {
            // nearField.dir.set(-1, 0);
            farField.dir.set(1, 0);
        } else {
            // nearField.dir.set(1, 0);
            farField.dir.set(-1, 0);
        }
        // nearField.run();
        farField.run();
        if (psys.particles.length) {
            o = psys.particles[psys.particles.length-1].loc.copy();
            psys.origin.set(o);
        }
        psys.run();
    }
    ////////////////////////////////////////////////////////////////////////////
    // Window resizing logic
    s.windowResized = function () {
        winW = document.getElementsByTagName("html")[0].clientWidth;
        winH = document.getElementsByTagName("html")[0].clientHeight;
        s.resizeCanvas(winW, winH);
        // nearField.init();
        farField.init();
    }
    ////////////////////////////////////////////////////////////////////////////
    // Defines particle.
    function particle (l, _ageRate) {
        return {
            loc: l.copy(),
            vel: s.createVector(),
            acc: p5.Vector.random2D(),
            lifespan: 200,
            ageRate: _ageRate,
            maxSpeed: 5,
            // radius
            r: s.random(2, 12),
            // color
            c: s.createVector(s.random(0, 255), s.map(s.noise(this.r), 0, 1, 0, 255), s.random(150, 255)),
            applyForce: function (force) {
                var f = force.copy();
                f.div(this.r/5);
                this.acc.add(f);
            },
            isDead: function () {
                if (this.lifespan <= 0) {
                    return true;
                } return false;
            },
            collide: function (others) {
                var v = s.createVector();
                for (var i = 0; i < others.length; i++) {
                    var o = others[i];
                    if (this !== o && p5.Vector.dist(this.loc, o.loc) < this.r) {
                        v.set(p5.Vector.sub(this.loc, o.loc));
                        v.normalize();
                        this.applyForce(v);
                    }
                }
            },
            update: function () {
                var // nearForce = nearField.lookup(this.loc),
                    farForce = farField.lookup(this.loc);
                this.vel.mult(0.9);
                this.applyForce(farForce);
                // this.applyForce(p5.Vector.lerp(nearForce, farForce, s.map(this.loc.z, 0, windowDepth, 0, 1)));
                // this.applyForce(zDraft(this.loc));
                // this.collide(psys.particles);
                this.vel.add(this.acc);
                this.vel.limit(this.maxSpeed);
                this.loc.add(this.vel);
                this.acc.mult(0);
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
                if (this.loc.z < 0) {
                    this.loc.z = 0; // bounce z
                }
                if (this.loc.z > windowDepth) {
                    this.loc.z = windowDepth;
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
    ////////////////////////////////////////////////////////////////////////////
    // Defines particle system.
    function particleSystem (l) {
        return {
            origin: l.copy(),
            lifespan: 300,
            maxPop: 200,
            particles: [],
            addParticle: function () {
                this.particles.push(particle(this.origin, 20/this.maxPop));
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
    ////////////////////////////////////////////////////////////////////////////
    // Defines z-axis force.
    function zDraft(v) {
        var xoff = 200,
            z = s.map(s.noise((v.x / 40) * 0.3 + xoff, (v.y / 40) * 0.3, s.frameCount/100), 0, 1, -1, 1);
        return s.createVector(0, 0, z);
    }
    ////////////////////////////////////////////////////////////////////////////
    // Defines flow field.
    function flowField(_xoff, _yoff, _xdir) {
        return {
            resolution: 40,
            xoff: _xoff,
            yoff: _yoff,
            field: [],
            dir: s.createVector(_xdir, 0),
            rows: null,
            cols: null,
            xmargin: null,
            ymargin: null,
            init: function () {
                this.rows = s.floor(winH/this.resolution);
                this.cols = s.floor(winW/this.resolution);
                this.xmargin = (winW - (this.cols * this.resolution) + this.resolution) / 2;
                this.ymargin = (winH - (this.rows * this.resolution) + this.resolution) / 2;
                this.field = [];
                for (var r = 0; r < this.rows; r++) {
                    this.field.push([]);
                    for (var c = 0; c < this.cols; c++) {
                        this.field[r].push(null);
                    }
                }
                this.update();
            },
            lookup: function (v) {
                var row = s.constrain(s.round((v.y - this.ymargin)/this.resolution), 0, this.rows - 1),
                    col = s.constrain(s.round((v.x - this.xmargin)/this.resolution), 0, this.cols - 1);
                return this.field[row][col].copy();
            },
            update: function () {
                var ystep = 0;
                for (var r = 0; r < this.rows; r++) {
                    var xstep = 0;
                    for (var c = 0; c < this.cols; c++) {
                        var v = s.noise(xstep, ystep, s.frameCount/100);
                        var curlv = curl(v, v);
                        this.field[r][c] = curlv; //.normalize();
                        // var theta = s.map(s.noise(xstep, ystep + this.yoff, s.frameCount/100), 0, 1, s.radians(1), s.TWO_PI),
                        //     strength = s.map(s.noise(xstep + this.xoff, ystep + this.yoff, s.frameCount/100), 0, 1, 0, 1);
                        // this.field[r][c] = this.dir.copy();
                        // this.field[r][c].rotate(theta);
                        // this.field[r][c].setMag(strength);
                        xstep += 0.3;
                    }
                    ystep += 0.3;
                }
            },
            display: function () {
                for (var r = 0; r < this.rows; r++) {
                    for (var c = 0; c < this.cols; c++) {
                        var size = this.resolution * 0.75 * this.field[r][c].mag();
                        s.stroke(57, 200, 150, 50);
                        s.fill(57, 200, 150, 50);
                        s.push();
                        s.translate(this.resolution * c +  this.xmargin, this.resolution * r + this.ymargin);
                        s.rotate(this.field[r][c].heading());
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
                // this.display();
            }
        }
    }
    ////////////////////////////////////////////////////////////////////////////
    // Computes curl of vector field. Returns vector.
    function curl(x, y) {
        var epsilon = 0.0001,
            n1, n2,
            a, b;
        // Use finite differences technique to approximate derivatives.
        // Approximate rate of change in x wrt y.
        n1 = s.noise(x, y + epsilon);
        n2 = s.noise(x, y - epsilon);
        a = (n1 - n2) / (2 * epsilon);
        // Approximate rate of change in y wrt x.
        n1 = s.noise(x + epsilon, y);
        n2 = s.noise(x - epsilon, y);
        b = (n1 - n2) / (2 * epsilon);
        return new p5.Vector(a, -b);
    }

}

// Creates a new canvas running 'sketch' as a child of the element with id 'p5-sketch'.
var p5sketch = new p5(sketch, 'p5-sketch');