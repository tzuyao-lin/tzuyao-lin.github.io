/* Masked sky drift and independent tulip sway, at the approved 1× speed. */
(() => {
  'use strict';

  const image = document.querySelector('.quarto-about-solana img.about-image');
  if (!image) return;

  const ON_SECONDS = 0.5, OFF_SECONDS = 0.9;
  const DEFAULT_SPEED = 1;
  const OW = 1122, OH = 1402;            // original image size
  const W = 748, H = 935;                // working canvas (2/3 scale)
  const GS = 6;                          // flower displacement grid step (canvas px)

  const SKY_AMP = 6;
  const SKY_PERIOD = 15;
  const SKY_WAVE = 600;                  // wavelength (px) of the travelling phase along the diagonal
  const SKY_UP = [Math.cos(0.91), -Math.sin(0.91)];   // lower-left -> upper-right (screen y is down)
  const SKY_ANGLE = -0.91;               // prior tangent heading (rad), ~52 deg above horizontal
  const SG = 4, SGS = 2;                 // sky vertex grid step (px) and its log2
  const SKY_STEP = 0.045;                // seconds between sky re-samplings

  const PLANTS = [
    { h: [1075, 800], r: [1085, 905], hr: 48, amp: 2.2, T: 6.1, ph: 0.4, ph2: 2.0, sg: 1 },
    { h: [975, 885], r: [985, 1000], hr: 46, amp: 2.6, T: 8.3, ph: 3.9, ph2: 0.5, sg: -1 },
    { h: [1060, 915], r: [1065, 1015], hr: 52, amp: 2.4, T: 7.2, ph: 2.2, ph2: 4.1, sg: -1 },
    { h: [835, 925], r: [850, 1030], hr: 48, amp: 2.8, T: 5.6, ph: 5.1, ph2: 1.2, sg: 1 },
    { h: [885, 1005], r: [895, 1085], hr: 42, amp: 2.0, T: 9.0, ph: 1.3, ph2: 3.3, sg: 1 },
    { h: [1040, 1070], r: [1045, 1215], hr: 62, amp: 3.2, T: 7.7, ph: 4.4, ph2: 5.0, sg: -1 },
    { h: [900, 1115], r: [900, 1215], hr: 48, amp: 2.4, T: 6.6, ph: 0.9, ph2: 2.6, sg: -1 },
    { h: [835, 1205], r: [850, 1370], hr: 66, amp: 3.0, T: 8.8, ph: 3.0, ph2: 4.6, sg: 1 },
    { h: [1040, 1280], r: [1050, 1400], hr: 56, amp: 2.8, T: 5.9, ph: 5.7, ph2: 0.2, sg: 1 },
    { h: [960, 1065], r: [965, 1150], hr: 34, amp: 1.7, T: 7.0, ph: 2.8, ph2: 1.9, sg: 1 },
    { h: [775, 1005], r: [782, 1090], hr: 32, amp: 1.7, T: 6.3, ph: 1.8, ph2: 5.4, sg: -1 },
    { h: [925, 1290], r: [930, 1375], hr: 34, amp: 1.9, T: 8.0, ph: 4.9, ph2: 3.7, sg: -1 }
  ];

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  const PERSON = [
    [-30, 570], [120, 553], [230, 558], [300, 528], [345, 503], [355, 470], [362, 430],
    [385, 375], [415, 345], [425, 300], [440, 240], [470, 190], [520, 143], [580, 105],
    [650, 92], [740, 100], [820, 148], [880, 198], [920, 258], [952, 330], [972, 400],
    [966, 452], [932, 502], [882, 547], [822, 587], [778, 618], [748, 665], [708, 706],
    [658, 746], [614, 782], [640, 880], [700, 952], [746, 1030], [764, 1100], [762, 1200],
    [752, 1262], [736, 1340], [726, 1430], [-30, 1430]
  ];
  const FLOWERS = [
    [1160, 680], [1090, 702], [1046, 728], [1026, 786], [998, 828], [974, 846], [940, 864],
    [900, 874], [860, 874], [820, 876], [790, 890], [766, 930], [750, 990], [734, 1100],
    [700, 1440], [1160, 1440]
  ];

  const G = {};

  function boxBlur(a, w, h, r) {
    const tmp = new Float32Array(a.length), out = new Float32Array(a.length);
    const n = 2 * r + 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += a[y * w + clamp(x + k, 0, w - 1)];
        tmp[y * w + x] = s / n;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += tmp[clamp(y + k, 0, h - 1) * w + x];
        out[y * w + x] = s / n;
      }
    }
    return out;
  }

  function buildAssets(img) {
    const src = G.src = mk(W, H);
    const sx = src.getContext('2d');
    sx.imageSmoothingQuality = 'high';
    sx.drawImage(img, 0, 0, W, H);          // any resolution -> normalized canvas

    const cw = G.cw = Math.round(W / 3), ch = G.ch = Math.round(H / 3);
    const cm = mk(cw, ch), cmx = cm.getContext('2d');
    cmx.imageSmoothingQuality = 'high';
    cmx.drawImage(src, 0, 0, cw, ch);
    const px = cmx.getImageData(0, 0, cw, ch).data;       // throws if tainted (file://) -> fallback

    const mc = mk(cw, ch), mx = mc.getContext('2d');
    mx.fillStyle = '#000'; mx.fillRect(0, 0, cw, ch);
    mx.fillStyle = '#fff';
    mx.scale(cw / OW, ch / OH);
    for (const poly of [PERSON, FLOWERS]) {
      mx.beginPath();
      poly.forEach((p, i) => i ? mx.lineTo(p[0], p[1]) : mx.moveTo(p[0], p[1]));
      mx.closePath(); mx.fill();
    }
    const raw = mx.getImageData(0, 0, cw, ch).data;
    const non = new Float32Array(cw * ch), warm = new Float32Array(cw * ch);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        non[i] = raw[i * 4] / 255;
        if (x / cw > 0.55 && y / ch > 0.45) {
          const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
          if (r > g + 15 && r > b + 30) warm[i] = 1;
        }
      }
    }
    const R = 2;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        if (!warm[y * cw + x]) continue;
        for (let dy = -R; dy <= R; dy++) {
          for (let dx = -R; dx <= R; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < cw && yy < ch) non[yy * cw + xx] = 1;
          }
        }
      }
    }
    let nb = boxBlur(non, cw, ch, 1);
    nb = boxBlur(nb, cw, ch, 1);
    const sky = G.sky = new Float32Array(cw * ch);
    for (let i = 0; i < sky.length; i++) sky[i] = 1 - smooth(0.04, 0.5, nb[i]);

    buildPatch();                            // flower warp + person overlay; also sets G.srcData
    buildSky(px);
  }

  function polyAlpha(poly) {
    const c = mk(W, H), x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.scale(W / OW, H / OH);
    x.beginPath();
    poly.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
    x.closePath(); x.fill();
    const d = x.getImageData(0, 0, W, H).data, a = new Float32Array(W * H);
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255;
    return a;
  }

  function buildPatch() {
    let fa = polyAlpha(FLOWERS);
    for (let k = 0; k < 3; k++) fa = boxBlur(fa, W, H, 3);
    for (let i = 0; i < fa.length; i++) fa[i] = smooth(0.03, 0.5, fa[i]);

    const base = G.srcData = G.src.getContext('2d').getImageData(0, 0, W, H).data;
    buildWarp(fa);

    let reach = fa;
    for (let k = 0; k < 2; k++) reach = boxBlur(reach, W, H, 6);
    let pa = polyAlpha(PERSON);
    pa = boxBlur(pa, W, H, 1);
    const O = mk(W, H), octx = O.getContext('2d');
    const od = octx.createImageData(W, H);
    for (let i = 0; i < pa.length; i++) {
      od.data[i * 4] = base[i * 4]; od.data[i * 4 + 1] = base[i * 4 + 1]; od.data[i * 4 + 2] = base[i * 4 + 2];
      od.data[i * 4 + 3] = pa[i] * smooth(0.005, 0.03, reach[i]) * 255;
    }
    octx.putImageData(od, 0, 0);
    G.person = O;
  }

  function buildWarp(fa) {
    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (fa[y * W + x] > 0.004) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const nx = Math.ceil(bw / GS) + 2, ny = Math.ceil(bh / GS) + 2, nv = nx * ny;
    const S = W / OW;
    const pl = PLANTS.map((p) => {
      const hx = p.h[0] * S, hy = p.h[1] * S, rx = p.r[0] * S, ry = p.r[1] * S;
      const L = Math.hypot(hx - rx, hy - ry);
      return {
        hx, hy, rx, ry, L, ax: (hx - rx) / L, ay: (hy - ry) / L, hr: p.hr * S,
        amp: p.amp, w: 2 * Math.PI / p.T, ph: p.ph, ph2: p.ph2, sg: p.sg,
        wt: new Float32Array(nv), j0: ny, j1: -1
      };
    });
    const vy = new Float32Array(nv), supp = new Float32Array(nv);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const v = j * nx + i, x = x0 + i * GS, y = y0 + j * GS;
        vy[v] = y;
        const fx = clamp(Math.round(x), 0, W - 1), fy = clamp(Math.round(y), 0, H - 1);
        const f = fa[fy * W + fx];
        let sum = 0;
        for (const p of pl) {
          const dx = x - p.rx, dy = y - p.ry;
          const s = dx * p.ax + dy * p.ay, l = -dx * p.ay + dy * p.ax;
          const q = l / (p.hr * 1.35);
          let w = Math.exp(-q * q * q * q) * smooth(-0.05 * p.L, 0.35 * p.L, s);
          if (s > p.L) { const e = (s - p.L) / (p.hr * 1.3); w *= Math.exp(-e * e); }
          w *= f;
          if (w < 0.004) w = 0;
          p.wt[v] = w; sum += w;
        }
        supp[v] = sum;
      }
    }
    for (let v = 0; v < nv; v++) {
      const n = Math.max(1, supp[v]), j = (v / nx) | 0;
      for (const p of pl) {
        if (p.wt[v] > 0) { p.wt[v] /= n; if (j < p.j0) p.j0 = j; if (j > p.j1) p.j1 = j; }
      }
    }
    const AX = [], AY = [], AV = [], AFX = [], AFY = [], AA = [];
    for (let y = y0; y <= y1; y++) {
      const j = ((y - y0) / GS) | 0, ty = (y - y0) / GS - j;
      for (let x = x0; x <= x1; x++) {
        const a = fa[y * W + x];
        if (a <= 0.004) continue;
        const i = ((x - x0) / GS) | 0, v = j * nx + i;
        if (supp[v] + supp[v + 1] + supp[v + nx] + supp[v + nx + 1] <= 0) continue;
        AX.push(x); AY.push(y); AV.push(v); AFX.push((x - x0) / GS - i); AFY.push(ty); AA.push(Math.round(a * 255));
      }
    }
    const cv = mk(bw, bh);
    G.warp = {
      x0, y0, bw, bh, nx, ny, nv, pl, vy, n: AX.length,
      AX: Int16Array.from(AX), AY: Int16Array.from(AY), AV: Int32Array.from(AV),
      AFX: Float32Array.from(AFX), AFY: Float32Array.from(AFY), AA: Uint8ClampedArray.from(AA),
      DX: new Float32Array(nv), DY: new Float32Array(nv),
      cv, cx: cv.getContext('2d'), img: new ImageData(bw, bh)
    };
  }

  function applyWarp(ctx, ta, sway) {
    const g = G.warp, nx = g.nx, DX = g.DX, DY = g.DY;
    DX.fill(0); DY.fill(0);
    for (const p of g.pl) {
      const ph = p.w * ta + p.ph;
      const m = 0.75 * Math.sin(ph) + 0.25 * Math.sin(1.73 * ph + p.ph2);
      const a = p.sg * p.amp * sway;
      const th = a * m / p.L, bx = 0.3 * a * Math.sin(1.37 * ph + 1.2), by = 0.35 * p.amp * sway * Math.sin(1.31 * ph + p.ph2);
      for (let j = p.j0; j <= p.j1; j++) {
        const dyr = g.vy[j * nx] - p.ry;
        for (let i = 0, v = j * nx; i < nx; i++, v++) {
          const w = p.wt[v];
          if (w === 0) continue;
          const dxr = g.x0 + i * GS - p.rx;
          DX[v] += w * (-th * dyr + bx);
          DY[v] += w * (th * dxr + by);
        }
      }
    }
    const src = G.srcData, out = g.img.data, bw = g.bw;
    const AX = g.AX, AY = g.AY, AV = g.AV, AFX = g.AFX, AFY = g.AFY, AA = g.AA;
    const mx = W - 1.001, my = H - 1.001;
    for (let n = 0; n < g.n; n++) {
      const v = AV[n], fx = AFX[n], fy = AFY[n], x = AX[n], y = AY[n];
      const v2 = v + nx;
      const dx = (DX[v] * (1 - fx) + DX[v + 1] * fx) * (1 - fy) + (DX[v2] * (1 - fx) + DX[v2 + 1] * fx) * fy;
      const dy = (DY[v] * (1 - fx) + DY[v + 1] * fx) * (1 - fy) + (DY[v2] * (1 - fx) + DY[v2 + 1] * fx) * fy;
      let sx = x - dx, sy = y - dy;
      sx = sx < 0 ? 0 : sx > mx ? mx : sx; sy = sy < 0 ? 0 : sy > my ? my : sy;
      const ix = sx | 0, iy = sy | 0, tx = sx - ix, ty = sy - iy;
      const i00 = (iy * W + ix) * 4, i10 = i00 + 4, i01 = i00 + W * 4, i11 = i01 + 4;
      const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
      const o = ((y - g.y0) * bw + (x - g.x0)) * 4;
      out[o] = src[i00] * w00 + src[i10] * w10 + src[i01] * w01 + src[i11] * w11;
      out[o + 1] = src[i00 + 1] * w00 + src[i10 + 1] * w10 + src[i01 + 1] * w01 + src[i11 + 1] * w11;
      out[o + 2] = src[i00 + 2] * w00 + src[i10 + 2] * w10 + src[i01 + 2] * w01 + src[i11 + 2] * w11;
      out[o + 3] = AA[n];
    }
    g.cx.putImageData(g.img, 0, 0);
    ctx.drawImage(g.cv, g.x0, g.y0);
  }

  function cellAt(a, x, y) {
    const w = G.cw;
    const fx = clamp(x / W * w - 0.5, 0, w - 1.001), fy = clamp(y / H * G.ch - 0.5, 0, G.ch - 1.001);
    const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0, i = y0 * w + x0;
    return (a[i] * (1 - tx) + a[i + 1] * tx) * (1 - ty) + (a[i + w] * (1 - tx) + a[i + w + 1] * tx) * ty;
  }

  function buildSky(px) {
    const cw = G.cw, ch = G.ch, n = cw * ch, sky = G.sky;

    const lum = new Float32Array(n);
    for (let i = 0; i < n; i++) lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    let jxx = new Float32Array(n), jyy = new Float32Array(n), jxy = new Float32Array(n), jw = new Float32Array(n);
    for (let y = 1; y < ch - 1; y++) {
      for (let x = 1; x < cw - 1; x++) {
        const i = y * cw + x;
        if (Math.min(sky[i], sky[i - 1], sky[i + 1], sky[i - cw], sky[i + cw]) < 0.9) continue;
        const gx = (lum[i + 1] - lum[i - 1]) * 0.5, gy = (lum[i + cw] - lum[i - cw]) * 0.5;
        jxx[i] = gx * gx; jyy[i] = gy * gy; jxy[i] = gx * gy; jw[i] = 1;
      }
    }
    for (let k = 0; k < 2; k++) {              // ~ gaussian sigma 5-6 cells (~17 px): band scale, not stroke scale
      jxx = boxBlur(jxx, cw, ch, 6); jyy = boxBlur(jyy, cw, ch, 6);
      jxy = boxBlur(jxy, cw, ch, 6); jw = boxBlur(jw, cw, ch, 6);
    }

    let vx = new Float32Array(n), vy = new Float32Array(n);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        const X = (x + 0.5) * W / cw, Y = (y + 0.5) * H / ch;
        const pa = SKY_ANGLE + 0.17 * Math.sin(X / 300 - Y / 400 + 0.9) + 0.07 * Math.sin(Y / 190 + X / 520 + 1.3);
        let bx = Math.cos(2 * pa), by = Math.sin(2 * pa);
        const wsum = jw[i];
        if (wsum > 0.02) {
          const a = jxx[i] / wsum, b = jyy[i] / wsum, c = jxy[i] / wsum;
          const m = Math.hypot(a - b, 2 * c), coh = m / (a + b + 8);
          if (m > 1e-6) {
            const wc = 0.85 * smooth(0.1, 0.45, coh);
            bx = (1 - wc) * bx + wc * (-(a - b) / m);     // tangent = gradient angle + 90 deg
            by = (1 - wc) * by + wc * (-2 * c / m);
          }
        }
        const th = 0.5 * Math.atan2(by, bx);
        const tx = Math.cos(th), ty = Math.sin(th);
        const d = tx * Math.cos(pa) + ty * Math.sin(pa);
        const s = d >= 0 ? 1 : -1, f = smooth(0.1, 0.5, Math.abs(d));
        vx[i] = tx * s * f; vy[i] = ty * s * f;
      }
    }
    for (let k = 0; k < 2; k++) { vx = boxBlur(vx, cw, ch, 2); vy = boxBlur(vy, cw, ch, 2); }

    let er = boxBlur(sky, cw, ch, 3);
    er = boxBlur(er, cw, ch, 3);
    for (let i = 0; i < n; i++) {
      const a = smooth(0.93, 0.999, er[i]);
      vx[i] *= a; vy[i] *= a;
    }

    const nxs = (W >> SGS) + 2, nys = (H >> SGS) + 2, nv = nxs * nys;
    const act = new Uint8Array(nv);
    const VI = [], VX = [], VY = [], VP = [];
    const k = 2 * Math.PI / SKY_WAVE;
    for (let j = 0; j < nys; j++) {
      for (let i = 0; i < nxs; i++) {
        const x = i * SG, y = j * SG;
        const ax = cellAt(vx, x, y), ay = cellAt(vy, x, y);
        if (ax * ax + ay * ay < 1e-6) continue;
        act[j * nxs + i] = 1;
        VI.push(j * nxs + i); VX.push(ax); VY.push(ay);
        VP.push(-k * (x * SKY_UP[0] + y * SKY_UP[1]) + 0.8 * Math.sin(x / 230 + y / 310 + 0.5));
      }
    }

    let x0 = W, x1 = -1, y0 = H, y1 = -1;
    const PX = [], PY = [], PA = [];
    for (let y = 0; y < H; y++) {
      const j = y >> SGS;
      for (let x = 0; x < W; x++) {
        const i = x >> SGS, v = j * nxs + i;
        if (!(act[v] | act[v + 1] | act[v + nxs] | act[v + nxs + 1])) continue;
        const a = Math.round(clamp(cellAt(sky, x, y), 0, 1) * 255);
        if (a < 2) continue;
        PX.push(x); PY.push(y); PA.push(a);
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    const bw = Math.max(1, x1 - x0 + 1), bh = Math.max(1, y1 - y0 + 1);
    const cv = mk(bw, bh);
    G.skyD = {
      nxs, x0, y0, bw, bh, n: PX.length,
      VI: Int32Array.from(VI), VX: Float32Array.from(VX), VY: Float32Array.from(VY), VP: Float32Array.from(VP),
      DX: new Float32Array(nv), DY: new Float32Array(nv),
      PX: Int16Array.from(PX), PY: Int16Array.from(PY), PA: Uint8ClampedArray.from(PA),
      cv, cx: cv.getContext('2d'), img: new ImageData(bw, bh)
    };
  }

  function applySky(ts, amt) {
    const g = G.skyD, DX = g.DX, DY = g.DY, nxs = g.nxs;
    const wt = 2 * Math.PI / SKY_PERIOD * ts, A = SKY_AMP * amt;
    for (let k = 0; k < g.VI.length; k++) {
      const s = Math.sin(wt + g.VP[k]) * A, v = g.VI[k];
      DX[v] = g.VX[k] * s; DY[v] = g.VY[k] * s;
    }
    const src = G.srcData, out = g.img.data, bw = g.bw;
    const PX = g.PX, PY = g.PY, PA = g.PA;
    const mx = W - 1.001, my = H - 1.001, q = 1 / SG, msk = SG - 1;
    for (let n = 0; n < g.n; n++) {
      const x = PX[n], y = PY[n];
      const v = (y >> SGS) * nxs + (x >> SGS), v2 = v + nxs;
      const fx = (x & msk) * q, fy = (y & msk) * q;
      const dx = (DX[v] * (1 - fx) + DX[v + 1] * fx) * (1 - fy) + (DX[v2] * (1 - fx) + DX[v2 + 1] * fx) * fy;
      const dy = (DY[v] * (1 - fx) + DY[v + 1] * fx) * (1 - fy) + (DY[v2] * (1 - fx) + DY[v2 + 1] * fx) * fy;
      let sx = x - dx, sy = y - dy;             // source-space and canvas y both point down
      sx = sx < 0 ? 0 : sx > mx ? mx : sx; sy = sy < 0 ? 0 : sy > my ? my : sy;
      const ix = sx | 0, iy = sy | 0, tx = sx - ix, ty = sy - iy;
      const i00 = (iy * W + ix) * 4, i10 = i00 + 4, i01 = i00 + W * 4, i11 = i01 + 4;
      const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
      const o = ((y - g.y0) * bw + (x - g.x0)) * 4;
      out[o] = src[i00] * w00 + src[i10] * w10 + src[i01] * w01 + src[i11] * w11;
      out[o + 1] = src[i00 + 1] * w00 + src[i10 + 1] * w10 + src[i01 + 1] * w01 + src[i11 + 1] * w11;
      out[o + 2] = src[i00 + 2] * w00 + src[i10 + 2] * w10 + src[i01 + 2] * w01 + src[i11 + 2] * w11;
      out[o + 3] = PA[n];
    }
    g.cx.putImageData(g.img, 0, 0);
  }

  class Painter {
    constructor(canvas) {
      canvas.width = W; canvas.height = H;
      this.ctx = canvas.getContext('2d');
      this.ta = 0;                                 // ambient clock for the flower sway (persists across hovers)
      this.ts = 0;                                 // sky clock (persists across hovers, independent of ta)
      this.skyAcc = Infinity;                      // time since the cached sky patch was sampled
    }

    render(skyA = 1, sway = 0) {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(G.src, 0, 0);
      if (skyA > 0.001) {
        if (this.skyAcc >= SKY_STEP) { applySky(this.ts, skyA); this.skyAcc = 0; }
        ctx.drawImage(G.skyD.cv, G.skyD.x0, G.skyD.y0);
      }
      if (sway > 0.001) applyWarp(ctx, this.ta, sway);   // per-plant flower field (see buildWarp)
      ctx.drawImage(G.person, 0, 0);
    }
  }


  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const frame = document.createElement('button');
  const canvas = document.createElement('canvas');
  const originalClass = image.className, originalStyle = image.style.cssText;
  frame.type = 'button';
  frame.className = originalClass;
  frame.style.cssText = originalStyle;
  frame.setAttribute('aria-label', 'Play or pause portrait animation');
  frame.setAttribute('aria-pressed', 'false');
  canvas.setAttribute('aria-hidden', 'true');
  const state = {hover: false, focus: false, override: null};
  let painter = null, act = 0, raf = 0, last = 0, mounted = false;
  const wanted = () => state.override ?? (!reduce.matches && (state.hover || state.focus));

  function kick() {
    frame.setAttribute('aria-pressed', String(wanted()));
    if (!painter || raf || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  }

  function tick(time) {
    raf = 0;
    if (document.hidden) { last = 0; return; }
    const dt = last ? clamp((time - last) / 1000, 0, 0.05) : 0.016;
    last = time;
    act = clamp(act + (wanted() ? dt / ON_SECONDS : -dt / OFF_SECONDS), 0, 1);
    canvas.style.opacity = String(smooth(0, 1, act / 0.12));
    if (!act) { painter.skyAcc = Infinity; last = 0; return; }
    painter.ts += dt * DEFAULT_SPEED;
    painter.ta += dt * (0.6 + 1.6 * DEFAULT_SPEED);
    painter.skyAcc += dt;
    try { painter.render(smooth(0, 1, act), smooth(0, 1, act)); }
    catch (error) { fail(error); return; }
    raf = requestAnimationFrame(tick);
  }

  function reset() {
    state.hover = state.focus = false;
    state.override = null;
    kick();
  }

  function fail(error) {
    console.warn('Portrait animation unavailable; keeping the static image.', error);
    if (raf) cancelAnimationFrame(raf);
    raf = 0; painter = null;
    if (mounted) {
      image.className = originalClass;
      image.style.cssText = originalStyle;
      frame.replaceWith(image);
      mounted = false;
    }
  }

  frame.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') { state.hover = true; state.override = null; kick(); }
  });
  frame.addEventListener('pointerleave', () => { state.hover = false; state.override = null; kick(); });
  frame.addEventListener('pointercancel', reset);
  frame.addEventListener('focus', () => { state.focus = frame.matches(':focus-visible'); kick(); });
  frame.addEventListener('blur', () => { state.focus = false; state.override = null; kick(); });
  frame.addEventListener('click', () => { state.override = !wanted(); kick(); });
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; last = 0; act = 0;
      canvas.style.opacity = '0';
      reset();
    } else {
      state.hover = frame.matches(':hover');
      kick();
    }
  });
  reduce.addEventListener('change', () => {
    state.override = null;
    if (reduce.matches) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; last = 0; act = 0;
      canvas.style.opacity = '0';
    }
    kick();
  });

  function start() {
    if (!image.naturalWidth || mounted) return;
    try {
      buildAssets(image);
      painter = new Painter(canvas);
      painter.render(0, 0);
      image.replaceWith(frame);
      image.classList.remove('about-image');
      image.style.removeProperty('width');
      frame.append(image, canvas);
      mounted = true;
      state.hover = frame.matches(':hover');
      if (wanted()) kick();
    } catch (error) { fail(error); }
  }
  if (image.complete) start();
  else image.addEventListener('load', start, {once: true});
})();
