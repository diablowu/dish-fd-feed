import './style.css'
import { Renderer } from './src/Renderer.js'
import { Parabola } from './src/Parabola.js'
import { Feed } from './src/Feed.js'

document.querySelector('#app').innerHTML = `
  <div id="canvas-container">
    <canvas id="mainCanvas"></canvas>
  </div>
  <div id="controls">
    <h2>Parabola Settings</h2>
    <div class="control-group">
      <label>Diameter (D) [m] <span id="val-D" class="value-display">3</span></label>
      <input type="range" id="input-D" min="0.3" max="10" step="0.1" value="3">
    </div>
    <div class="control-group">
      <label>f/D Ratio <span id="val-fd" class="value-display">0.5</span></label>
      <input type="range" id="input-fd" min="0.1" max="1" step="0.01" value="0.5">
    </div>
    <div class="control-group">
      <label>Focal Length (f) [m] <span id="val-f" class="value-display">1.5</span></label>
      <!-- f is now read-only, calculated from D and f/D -->
    </div>

    <h2>Feed Settings</h2>
    <div class="control-group">
      <label>10dB Angle (deg) <span id="val-angle" class="value-display">90</span></label>
      <input type="range" id="input-angle" min="10" max="160" value="90">
    </div>
    <div class="control-group">
      <label>Height Offset [m] <span id="val-offset" class="value-display">0</span></label>
      <input type="range" id="input-offset" min="-10" max="10" step="0.01" value="0">
    </div>

    <h2>Visualization</h2>
    <div class="control-group">
      <label><input type="checkbox" id="check-rays" checked> Show Rays</label>
      <label><input type="checkbox" id="check-normal"> Show Normals</label>
      <label><input type="checkbox" id="check-feed" checked> Show Feed Pattern</label>
    </div>
  </div>
`

const canvas = document.getElementById('mainCanvas');
const renderer = new Renderer(canvas);
const parabola = new Parabola(3, 1.5); // D, f (meters)
const feed = new Feed(90, 0); // angle, offset (meters)

// Initial Render
function animate() {
  renderer.clear();
  renderer.drawParabola(parabola);
  renderer.drawFeed(feed, parabola);
  requestAnimationFrame(animate);
}
animate();

// Event Listeners
const inputD = document.getElementById('input-D');
const inputFD = document.getElementById('input-fd');
const inputAngle = document.getElementById('input-angle');
const inputOffset = document.getElementById('input-offset');

function updateUI() {
  const D = parseFloat(inputD.value);
  const fd = parseFloat(inputFD.value);
  const f = D * fd;

  document.getElementById('val-D').textContent = D.toFixed(1);
  document.getElementById('val-fd').textContent = fd.toFixed(2);
  document.getElementById('val-f').textContent = f.toFixed(2);
  document.getElementById('val-angle').textContent = inputAngle.value;
  document.getElementById('val-offset').textContent = inputOffset.value;

  parabola.D = D;
  parabola.f = f;
  feed.angle = parseFloat(inputAngle.value);
  feed.offset = parseFloat(inputOffset.value);
}

[inputD, inputFD, inputAngle, inputOffset].forEach(el => {
  el.addEventListener('input', updateUI);
});

// Toggles
document.getElementById('check-rays').addEventListener('change', (e) => renderer.showRays = e.target.checked);
document.getElementById('check-normal').addEventListener('change', (e) => renderer.showNormals = e.target.checked);
document.getElementById('check-feed').addEventListener('change', (e) => renderer.showFeed = e.target.checked);
