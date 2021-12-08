document.addEventListener('DOMContentLoaded', function domLoaded() {
    document.addEventListener('click', function clickHandler(evt) {
        Snowflake.burst(evt.clientX, evt.clientY, 12);
    });
    Ticker.addListener(Snowflake.step);

    // show initial burst for preview!
    setTimeout(function initialBurst() {
        Snowflake.burst(window.innerWidth * 0.5, window.innerHeight * 0.3, 25);
    }, 200);
});

// snowflake constructor
function Snowflake() {
    this.node = document.createElement('div');
    this.node.classList.add('deco-snowflake');
    this.node.style.position = 'fixed';
}
// initialize a snowflake
Snowflake.prototype.init = function init(x, y, angle_ratio) {
    // track snowflake life in ms
    this.life = 0;
    this.lifespan = Math.random() * 1500 + 1500;
    // top-left fixed position in px
    this.x = x;
    this.y = y;
    // size in px
    this.radius = Math.floor(Math.random() * 10 + 8);
    // starting rotation in degrees
    this.rotation = Math.random() * 360;
    // velocities
    var launch_speed = Math.random() * 6;
    var launch_angle = angle_ratio * Math.PI * 2;
    this.speed_x = Math.sin(launch_angle) * launch_speed;
    this.speed_y = -Math.cos(launch_angle) * launch_speed;
    this.speed_rot = Math.random() * 4 - 2;
    this.gravity = 1.5;
    // apply initial styles
    this.node.style.width = this.radius * 2 + 'px';
    this.node.style.height = this.radius * 2 + 'px';
    // show properties
    this.render();
};

// apply styles
Snowflake.prototype.render = function render() {
    this.node.style.left = this.x - this.radius + 'px';
    this.node.style.top = this.y - this.radius + 'px';
    this.node.style.transform = 'rotate(' + this.rotation + 'deg)';
};

// get a new, initialized snowflake instance
Snowflake.new = function newSnowflake(x, y, angle_ratio) {
    var s = Snowflake.pool.pop() || new Snowflake();
    s.init(x, y, angle_ratio);
    document.body.appendChild(s.node);
    Snowflake.active.push(s);
    return s;
};
// destroy snowflake; return to pool
Snowflake.prototype.kill = function killSnowflake(index) {
    var Snowflake = window.Snowflake;

    Snowflake.active.splice(index, 1);
    Snowflake.pool.push(this);
    document.body.removeChild(this.node);
};

// maintain array of active snowflakes, and an inactive pool
Snowflake.active = [];
Snowflake.pool = [];

// create a burst of snowflakes!
Snowflake.burst = function burst(x, y, count) {
    if (!x && !y) return;
    for (var i = 0; i < count; i++) {
        Snowflake.new(x, y, i / count);
    }
};


// animation loop
Snowflake.step = function snowflakeStep(time, lag) {
    var Snowflake = window.Snowflake;

    // loop backwards since snowflakes may be removed
    for (var i = Snowflake.active.length - 1; i >= 0; i--) {
        var s = Snowflake.active[i];
        s.life += time;
        if (s.life < s.lifespan) {
            s.x += s.speed_x * lag;
            s.y += (s.speed_y + s.gravity) * lag;
            s.rotation += s.speed_rot * lag;
            s.render();
            var damp = 1 - (0.05 * lag);
            s.speed_x *= damp;
            s.speed_y *= damp;
        } else {
            // kill snowflake
            s.kill(i);
        }
    }
};


// Frame ticker helper class
var Ticker = (function() {
    var PUBLIC_API = {};

    // public
    // will call function reference repeatedly once registered, passing elapsed time and a lag multiplier as parameters
    PUBLIC_API.addListener = function addListener(fn) {
        if (typeof fn !== 'function') throw ('Ticker.addListener() requires a function reference passed in.');

        listeners.push(fn);

        // start frame-loop lazily
        if (!started) {
            started = true;
            queueFrame();
        }
    };

    // private
    var started = false;
    var last_timestamp = 0;
    var listeners = [];
    // queue up a new frame (calls frameHandler)
    function queueFrame() {
        if (window.requestAnimationFrame) {
            requestAnimationFrame(frameHandler);
        } else {
            webkitRequestAnimationFrame(frameHandler);
        }
    }

    function frameHandler(timestamp) {
        var frame_time = timestamp - last_timestamp;
        last_timestamp = timestamp;
        // make sure negative time isn't reported (first frame can be whacky)
        if (frame_time < 0) {
            frame_time = 17;
        }
        // - cap minimum framerate to 15fps[~68ms] (assuming 60fps[~17ms] as 'normal')
        else if (frame_time > 68) {
            frame_time = 68;
        }

        // fire custom listeners
        for (var i = 0, len = listeners.length; i < len; i++) {
            listeners[i].call(window, frame_time, frame_time / 16.67);
        }

        // always queue another frame
        queueFrame();
    }

    return PUBLIC_API;
}());