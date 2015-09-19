////////////////////////////////////////////////////////////////////////////////
// CURL NOISE SKETCH
var sketch = function (s) {
	var winW, winH,
		noiseScale = 0.001,
		particles = [],
		polarities = [],
		ages = [],
		maxParticles = 2000,
		maxSpeed = 2,
		barrier,
		barrierSize,
		emitter;
	////////////////////////////////////////////////////////////////////////////
	// Sets up sketch.
	s.setup = function () {
		s.colorMode(s.HSB, 360, 100, 100, 1);
		winW = document.getElementsByTagName("html")[0].clientWidth;
		winH = document.getElementsByTagName("html")[0].clientHeight;
		s.createCanvas(winW, winH);
		setSizes();
	};

	////////////////////////////////////////////////////////////////////////////
	// Draws.
	s.draw = function () {
		s.background(0, 0.02);
		if (particles.length < maxParticles) {
			particles.push(emitter.copy());
			polarities.push(1);
			ages.push(1000);
		}
		s.stroke(360);
		s.noFill();

		s.stroke((s.frameCount/10) % 360, 100, 100, 1)
		for (var i = 0; i < particles.length; i++) {
			var loc = particles[i],
				vel = curl(loc.x, loc.y, s.frameCount).setMag(maxSpeed);
			vel.mult(polarities[i]);
			loc.add(vel);
			contain(loc, i);
			s.point(loc.x, loc.y);
			if (ages[i] <= 0) {
				particles[i] = emitter.copy();
				polarities[i] = 1;
				ages[i] = 1000;
			} else { ages[i] -= 1 };
		}
	};
	////////////////////////////////////////////////////////////////////////////
	// Window resizing logic
	s.windowResized = function () {
		winW = document.getElementsByTagName("html")[0].clientWidth;
		winH = document.getElementsByTagName("html")[0].clientHeight;
		s.resizeCanvas(winW, winH);
		setSizes();
		particles = [];
		polarities = [];
		ages = [];
	};
	////////////////////////////////////////////////////////////////////////////
	// Sets barrier and emitter info based on window size.
	function setSizes() {
		barrier = s.createVector(winW/2, winH/2);
		barrierSize = s.min(winW - 50, winH - 50);
		emitter = s.createVector(winW/2, winH/2);
	}
	////////////////////////////////////////////////////////////////////////////
	// Uses finite difference method to compute curl of a gradient of a
	// potential field.
	function curl(x, y, t) {
		var eps = 1,
			n1, n2, a, b;
		// Change in x wrt y.
		n1 = rampedPotential(x, (y + eps), t);
		n2 = rampedPotential(x, (y - eps), t);
		a = (n1 - n2)/(2 * eps);
		// Change in y wrt x.
		n1 = rampedPotential((x + eps), y, t);
		n2 = rampedPotential((x - eps), y, t);
		b = (n1 - n2)/(2 * eps);
		return s.createVector(a, -b);
	}
	////////////////////////////////////////////////////////////////////////////
	// Computes value of Perlin noise at a coordinate.
	function scaledNoise(x, y, t) {
		return s.noise(x * noiseScale, y * noiseScale, t * noiseScale);
	}
	////////////////////////////////////////////////////////////////////////////
	// Modulates the potential field by applying a ramp through zero based on
	// distance to the closest boundary point.
	function rampedPotential(x, y, t) {
		return scaledNoise(x, y, t) * ramp(x, y);
	}
	////////////////////////////////////////////////////////////////////////////
	// Smoothly ramps through zero based on distance to the closest boundary
	// point and width of the modified region of Perlin space (noiseScale).
	function ramp(x, y) {
		var v = barrier.copy().sub(x, y),
			d = v.mag()-barrierSize/2,
			r = d/noiseScale;
		if (r >= 1) { return 1; }
		if (r <= -1) { return -1; }
		return (15/8)*r - (10/8)*Math.pow(r, 3) + (3/8)*Math.pow(r, 5);
	}
	////////////////////////////////////////////////////////////////////////////
	// Keeps particles inside the barrier.
	function contain(v, i) {
		var d = p5.Vector.sub(barrier, v);
		// Check if particle has moved outside boundary.
		if (d.mag() >= barrierSize/2) {
			// Move particle back inside boundary.
			d.setMag(maxSpeed + 1);
			v.add(d);
			// Reverse particle's directional polarity.
			polarities[i] *= -1;
		}
	}
};
////////////////////////////////////////////////////////////////////////////////
// START
// Creates canvas running 'sketch' as child of the element with id 'p5-sketch'.
var p5sketch = new p5(sketch, 'p5-sketch');