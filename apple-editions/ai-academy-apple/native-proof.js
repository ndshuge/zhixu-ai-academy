/* Native Edition R3 – same deterministic Logistic equation as the published course.
   Visual-only preview; never used for grading or modifying study evidence. */
export function nativeLogisticPlot() {
  const samples = [];
  let a = 0.41200, b = 0.41201;
  for (let n = 0; n < 66; n++) {
    samples.push([a, b]);
    a = 3.9 * a * (1 - a);
    b = 3.9 * b * (1 - b);
  }
  const draw = (i) => samples.map((v, n) =>
    (n ? 'L' : 'M') + (34 + n * 6.24).toFixed(2) + ' ' +
    (205 - v[i] * 158).toFixed(2)
  ).join(' ');
  const guides = [0,.25,.5,.75,1].map(v =>
    '<line x1="34" x2="441" y1="' + (205-v*158) + '" y2="' + (205-v*158) + '"/>'
  ).join('');
  return '<div class="zx-plot" role="img" aria-label="依据真实 Logistic 公式计算的六十六轮迭代预览，两条初值相差十万分之一的轨迹逐渐分离">' +
    '<div class="zx-plot-title"><span>初值敏感性</span><span>Logistic · r = 3.9</span></div>' +
    '<svg viewBox="0 0 480 250" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
    '<g class="zx-plot-grid">' + guides + '</g>' +
    '<path class="zx-plot-line-one" d="' + draw(0) + '"/>' +
    '<path class="zx-plot-line-two" d="' + draw(1) + '"/>' +
    '</svg><div class="zx-plot-axis"><span>0</span><span>65 次迭代</span></div>' +
    '<div class="zx-plot-key"><span><i></i>x₀ = 0.41200</span><span><i></i>x₀ = 0.41201</span></div></div>';
}
