// Portable arithmetic kernels: no runtime-specific transcendental library in simulation decisions.
export function tanhApprox(x) {
  if (x >= 5) return 1; if (x <= -5) return -1;
  const y = x * x;
  return Math.max(-1, Math.min(1, x * (135135 + y * (17325 + y * (378 + y))) /
    (135135 + y * (62370 + y * (3150 + 28 * y)))));
}
export function sinCos(angle) {
  const pi=3.141592653589793, x=angle>pi?angle-2*pi:angle, xx=x*x;
  let sin=x, cos=1, st=x, ct=1;
  for(let k=1;k<=11;k++){st*= -xx/((2*k)*(2*k+1));ct*= -xx/((2*k-1)*(2*k));sin+=st;cos+=ct;}
  return [cos,sin];
}
export function norm(x,y) {
  // Seven Newton iterations for sqrt(1+r^2); range r in [0,1], IEEE arithmetic only.
  const ax=Math.abs(x),ay=Math.abs(y),m=Math.max(ax,ay);if(m===0)return 0;
  const r=Math.min(ax,ay)/m,z=1+r*r;let s=1;
  for(let i=0;i<7;i++)s=(s+z/s)*.5;
  return m*s;
}
