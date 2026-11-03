import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshLabPreview} from '../apple-editions/ai-academy-v5/v5-lab-preview.js';

test('Logistic preview description follows the actual slider value without fake study evidence',()=>{
 const plotAttributes=new Map();
 const paths={first:'',second:''};
 const svg={
  getAttribute(name){return plotAttributes.get(name)||''},
  setAttribute(name,value){plotAttributes.set(name,value)},
  querySelector(selector){
   if(selector==='[data-curve="first"]')return {setAttribute(name,value){if(name==='d')paths.first=value}};
   if(selector==='[data-curve="second"]')return {setAttribute(name,value){if(name==='d')paths.second=value}};
   return null;
  }
 };
 const output={textContent:''};
 const slider={value:'3.90'};
 const root={querySelector(selector){
  return {'#v5-preview-plot':svg,'#v5-r-value':output,'#v5-r-control':slider}[selector]||null;
 }};
 refreshLabPreview(root);
 assert.equal(output.textContent,'3.90');
 assert.match(svg.getAttribute('aria-label'),/r=3\.90/);
 assert.match(svg.getAttribute('aria-label'),/0\.41200.*0\.41201/);
 assert.match(svg.getAttribute('aria-label'),/预览/);
 const oldLabel=svg.getAttribute('aria-label'),oldPath=paths.first;
 slider.value='3.72';
 refreshLabPreview(root);
 assert.equal(output.textContent,'3.72');
 assert.match(svg.getAttribute('aria-label'),/r=3\.72/);
 assert.notEqual(svg.getAttribute('aria-label'),oldLabel);
 assert.notEqual(paths.first,oldPath);
});
