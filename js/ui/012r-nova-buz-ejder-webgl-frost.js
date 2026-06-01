/* Buz Ejderi — WebGL kar/buz kristali nefesi */
(function () {
  'use strict';

  var engines = new Map();

  var VERT = [
    'attribute vec2 a_pos;',
    'attribute float a_size;',
    'attribute vec4 a_color;',
    'uniform vec2 u_res;',
    'varying vec4 v_col;',
    'void main(){',
    '  v_col = a_color;',
    '  vec2 p = (a_pos / u_res) * 2.0 - 1.0;',
    '  p.y = -p.y;',
    '  gl_Position = vec4(p, 0.0, 1.0);',
    '  gl_PointSize = a_size;',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'varying vec4 v_col;',
    'void main(){',
    '  vec2 uv = gl_PointCoord - 0.5;',
    '  float d = length(uv);',
    '  if (d > 0.5) discard;',
    '  float core = smoothstep(0.5, 0.08, d);',
    '  float hex = abs(cos(atan(uv.y, uv.x) * 3.0)) * 0.15;',
    '  float a = core * v_col.a * (1.0 - hex);',
    '  gl_FragColor = vec4(v_col.rgb, a);',
    '}'
  ].join('\n');

  function FrostEngine(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.dead = false;
    this.running = false;
    this.raf = 0;
    this.last = 0;
    this.w = 0;
    this.h = 0;
    this.intensity = 0.32;
    this.burst = 0;
    this.mode = 'normal';
    this.ox = 0;
    this.oy = 0;
    this.max = 280;
    this.particles = [];
    for (var i = 0; i < this.max; i++) {
      this.particles.push({ alive: false });
    }
    this.data = new Float32Array(this.max * 7);
    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.initGl();
  }

  FrostEngine.prototype.initGl = function () {
    var gl;
    try {
      gl = this.canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false })
        || this.canvas.getContext('experimental-webgl');
    } catch (_) { gl = null; }
    if (!gl) { this.dead = true; return; }
    this.gl = gl;
    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VERT);
    gl.compileShader(vs);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, FRAG);
    gl.compileShader(fs);
    this.prog = gl.createProgram();
    gl.attachShader(this.prog, vs);
    gl.attachShader(this.prog, fs);
    gl.linkProgram(this.prog);
    this.uRes = gl.getUniformLocation(this.prog, 'u_res');
    this.buf = gl.createBuffer();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  };

  FrostEngine.prototype.resize = function () {
    if (!this.canvas || this.dead) return;
    var rect = this.canvas.getBoundingClientRect();
    var cssW = rect.width;
    var cssH = rect.height;
    if (!cssW || !cssH) {
      var stack = this.canvas.parentElement;
      var sr = stack && stack.getBoundingClientRect();
      if (sr && sr.width && sr.height) { cssW = sr.width; cssH = sr.height; }
    }
    if (!cssW || !cssH) { cssW = 220; cssH = 260; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(cssW * dpr));
    var h = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width === w && this.canvas.height === h && this._cssW === cssW) return;
    this._cssW = cssW;
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.w = w;
    this.h = h;
  };

  FrostEngine.prototype.setIntensity = function (v) {
    this.intensity = Math.max(0, Math.min(2.4, v));
  };

  FrostEngine.prototype.addBurst = function (n) {
    this.burst = Math.min(2.6, this.burst + n);
  };

  FrostEngine.prototype.syncOriginFromHost = function (host) {
    if (!host || !this.canvas) return;
    var mouth = host.querySelector('.nova-hero__mouth');
    var stack = host.querySelector('.nova-hero-buz-stack');
    var cRect = this.canvas.getBoundingClientRect();
    if (!cRect.width || !cRect.height) return;
    var dpr = this.w / cRect.width;
    if (stack && stack.dataset.mouthX && stack.dataset.mouthY) {
      this.ox = parseFloat(stack.dataset.mouthX) * this.w;
      this.oy = parseFloat(stack.dataset.mouthY) * this.h;
      return;
    }
    if (mouth) {
      var m = mouth.getBoundingClientRect();
      this.ox = (m.left + m.width * 0.52 - cRect.left) * dpr;
      this.oy = (m.top + m.height * 0.5 - cRect.top) * dpr;
      if (stack) {
        stack.dataset.mouthX = String(this.ox / this.w);
        stack.dataset.mouthY = String(this.oy / this.h);
      }
    } else {
      this.ox = this.w * 0.5;
      this.oy = this.h * 0.36;
    }
  };

  FrostEngine.prototype.spawn = function (n, power) {
    var spawned = 0;
    for (var i = 0; i < this.max && spawned < n; i++) {
      var p = this.particles[i];
      if (p.alive) continue;
      var spread = 0.38 + Math.random() * 0.32;
      var ang = (-0.05 + Math.random() * 0.55) + (Math.random() - 0.5) * 0.22;
      var spd = (42 + Math.random() * 72) * power;
      p.alive = true;
      p.x = this.ox + (Math.random() - 0.5) * 8 * power;
      p.y = this.oy + (Math.random() - 0.5) * 6 * power;
      p.vx = Math.cos(ang) * spd * spread;
      p.vy = Math.sin(ang) * spd * 0.55 + 14 * power;
      p.vz = (Math.random() - 0.5) * 20;
      p.life = 0;
      p.ttl = 0.4 + Math.random() * 0.65;
      p.size = (8 + Math.random() * 14) * (0.8 + power * 0.4);
      p.spin = (Math.random() - 0.5) * 8;
      p.r = 0.75 + Math.random() * 0.25;
      p.g = 0.92 + Math.random() * 0.08;
      p.b = 1;
      p.a = 0.75 + Math.random() * 0.2;
      spawned++;
    }
  };

  FrostEngine.prototype.tick = function (dt) {
    var power = this.intensity + this.burst;
    if (this.burst > 0) this.burst = Math.max(0, this.burst - dt * 0.95);
    var rate = this.mode === 'low' ? 9 : 18;
    this.spawn(Math.round(rate * power * (dt * 60)), Math.max(0.3, power));

    for (var i = 0; i < this.max; i++) {
      var p = this.particles[i];
      if (!p.alive) continue;
      p.life += dt;
      if (p.life >= p.ttl) { p.alive = false; continue; }
      var t = p.life / p.ttl;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - dt * 1.6);
      p.vy += (8 - t * 28) * dt;
      p.vx += Math.sin(p.life * 12 + p.spin) * 10 * dt;
      var bx0 = this.w * 0.26;
      var bx1 = this.w * 0.74;
      var by0 = this.h * 0.22;
      var by1 = this.h * 0.68;
      if (p.x < bx0 || p.x > bx1 || p.y < by0 || p.y > by1) {
        p.alive = false;
        continue;
      }
      p.vz += Math.cos(p.life * 10) * 12 * dt;
      if (t < 0.2) {
        p.r = 0.9; p.g = 0.98; p.b = 1; p.a = 0.95;
      } else if (t < 0.5) {
        p.r = 0.55 + (1 - t) * 0.35;
        p.g = 0.85;
        p.b = 0.98;
        p.a = 0.8 * (1 - t * 0.3);
      } else {
        p.r = 0.35;
        p.g = 0.65;
        p.b = 0.92;
        p.a = 0.35 * (1 - t);
      }
    }
  };

  FrostEngine.prototype.draw = function () {
    if (this.dead || !this.gl || !this.w) return;
    var gl = this.gl;
    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var idx = 0;
    var data = this.data;
    for (var i = 0; i < this.max; i++) {
      var p = this.particles[i];
      if (!p.alive || p.a <= 0.02) continue;
      var base = idx * 7;
      data[base] = p.x;
      data[base + 1] = p.y;
      data[base + 2] = p.size * (this.w / 240);
      data[base + 3] = p.r;
      data[base + 4] = p.g;
      data[base + 5] = p.b;
      data[base + 6] = p.a;
      idx++;
    }
    if (!idx) return;
    gl.useProgram(this.prog);
    gl.uniform2f(this.uRes, this.w, this.h);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, idx * 7), gl.DYNAMIC_DRAW);
    var stride = 7 * 4;
    var pos = gl.getAttribLocation(this.prog, 'a_pos');
    var size = gl.getAttribLocation(this.prog, 'a_size');
    var col = gl.getAttribLocation(this.prog, 'a_color');
    gl.enableVertexAttribArray(pos);
    gl.enableVertexAttribArray(size);
    gl.enableVertexAttribArray(col);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(size, 1, gl.FLOAT, false, stride, 8);
    gl.vertexAttribPointer(col, 4, gl.FLOAT, false, stride, 12);
    gl.drawArrays(gl.POINTS, 0, idx);
  };

  FrostEngine.prototype.loop = function (now) {
    if (!this.running) return;
    if (this.host && window.novaSpritePerfCanAnimate && !window.novaSpritePerfCanAnimate(this.host)) {
      this.raf = requestAnimationFrame(this.loop);
      return;
    }
    if (!this.last) this.last = now;
    var dt = Math.min(0.032, (now - this.last) / 1000);
    this.last = now;
    this.tick(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  FrostEngine.prototype.start = function () {
    if (this.dead || this.running) return;
    this.running = true;
    this.last = 0;
    this.resize();
    this.raf = requestAnimationFrame(this.loop);
    window.addEventListener('resize', this.resize);
  };

  FrostEngine.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.removeEventListener('resize', this.resize);
    if (this.gl) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    for (var i = 0; i < this.max; i++) this.particles[i].alive = false;
  };

  function ensureStack(host) {
    var stack = host.querySelector('.nova-hero-buz-stack');
    if (stack) return stack;
    var svg = host.querySelector('svg');
    if (!svg) return null;
    if (!host.style.position || host.style.position === 'static') {
      host.style.position = 'relative';
    }
    stack = document.createElement('div');
    stack.className = 'nova-hero-buz-stack';
    host.insertBefore(stack, svg);
    stack.appendChild(svg);
    var canvas = document.createElement('canvas');
    canvas.className = 'nova-hero-buz-frost';
    canvas.setAttribute('aria-hidden', 'true');
    stack.appendChild(canvas);
    return stack;
  }

  function mountWebGL(host) {
    if (!host) return null;
    var stack = ensureStack(host);
    if (!stack) return null;
    var canvas = stack.querySelector('.nova-hero-buz-frost');
    if (!canvas) return null;
    var old = engines.get(host);
    if (old) old.stop();
    var eng = new FrostEngine(canvas);
    eng.host = host;
    engines.set(host, eng);
    if (!eng.dead) {
      eng.syncOriginFromHost(host);
      eng.start();
    }
    return eng;
  }

  function unmountWebGL(host) {
    var eng = engines.get(host);
    if (eng) eng.stop();
    engines.delete(host);
  }

  function getFrost(host) {
    return engines.get(host) || null;
  }

  window.novaBuzEjderMountWebGL = mountWebGL;
  window.novaBuzEjderUnmountWebGL = unmountWebGL;
  window.novaBuzEjderGetFrost = getFrost;
})();
