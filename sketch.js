// Defines the sketch.
var sketch = function (s) {
    // Sketch globals.
    var winW, winH,
        // Noise produces weird effects at edges. Offset to avoid edge.
        offset = 100;
    ////////////////////////////////////////////////////////////////////////////
    // Preloads assets using p5 *load functions.
    s.preload = function () {
    }
    ////////////////////////////////////////////////////////////////////////////
    // Sets up sketch.
    s.setup = function () {
        s.colorMode(s.HSB, 360, 100, 100, 1);
        winW = document.getElementsByTagName("html")[0].clientWidth;
        winH = document.getElementsByTagName("html")[0].clientHeight;
        s.createCanvas(winW, winH);
    }

    ////////////////////////////////////////////////////////////////////////////
    // Draws.
    s.draw = function () {
        s.background(0);
        var step = 40,
            xoff = (winW % step) / 2,
            yoff = (winH % step) / 2;
        s.push();
        s.translate(xoff, yoff);
        for (var x = step; x < winW - step; x += step) {
            for (var y = step; y < winH - step; y += step) {
                var curlv = curl(x + offset, y + offset, s.frameCount);
                curlv.setMag(10);
                // Add 180 to exclude negative numbers.
                s.stroke(s.degrees(curlv.heading()) + 180, 100, 100);
                s.line(x, y, x + curlv.x, y + curlv.y);
                s.ellipse(x, y, 2, 2);
            };
        };
        s.pop();
    }
    ////////////////////////////////////////////////////////////////////////////
    // Window resizing logic
    s.windowResized = function () {
        winW = document.getElementsByTagName("html")[0].clientWidth;
        winH = document.getElementsByTagName("html")[0].clientHeight;
        s.resizeCanvas(winW, winH);
    }
    ////////////////////////////////////////////////////////////////////////////
    // Computes curl of vector field. Returns vector.
    function curl(x, y, t) {
        var epsilon = 0.001,
            noiseScale = 0.001,
            tScale = 0.001,
            n1, n2,
            a, b;
        // Use finite differences technique to approximate derivatives.
        // Approximate rate of change in x wrt y.
        n1 = s.noise(x * noiseScale, (y * noiseScale) + epsilon, t * tScale);
        n2 = s.noise(x * noiseScale, (y * noiseScale) - epsilon, t * tScale);
        a = (n1 - n2) / (2 * epsilon);
        // Approximate rate of change in y wrt x.
        n1 = s.noise((x * noiseScale) + epsilon, y * noiseScale, t * tScale);
        n2 = s.noise((x * noiseScale) - epsilon, y * noiseScale, t * tScale);
        b = (n1 - n2) / (2 * epsilon);
        return new p5.Vector(a, -b);
    }

}

// Creates a new canvas running 'sketch' as a child of the element with id 'p5-sketch'.
var p5sketch = new p5(sketch, 'p5-sketch');