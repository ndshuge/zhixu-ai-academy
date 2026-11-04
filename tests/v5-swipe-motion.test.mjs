import test from 'node:test';import assert from 'node:assert/strict';
import {gestureRoute,routeDirection} from '../apple-editions/ai-academy-v5/v5-page-continuity.js';
test('edge swipes traverse main routes without affecting frozen Dock',()=>{
 assert.equal(gestureRoute({route:'today',width:390,startX:372,dx:-110,dy:8,reduced:false}),'learn');
 assert.equal(gestureRoute({route:'library',width:390,startX:18,dx:110,dy:3,reduced:false}),'learn');
 assert.equal(gestureRoute({route:'learn',width:390,startX:18,dx:130,dy:4,reduced:false}),'today');
 assert.equal(gestureRoute({route:'growth',width:390,startX:370,dx:-120,dy:0,reduced:false}),null);
});
test('vertical scroll, short taps, non-edge drags and reduced motion do not trigger page switch',()=>{
 assert.equal(gestureRoute({route:'today',width:390,startX:350,dx:-120,dy:150,reduced:false}),null);
 assert.equal(gestureRoute({route:'today',width:390,startX:160,dx:-140,dy:0,reduced:false}),null);
 assert.equal(gestureRoute({route:'today',width:390,startX:375,dx:-35,dy:0,reduced:false}),null);
 assert.equal(gestureRoute({route:'today',width:390,startX:375,dx:-140,dy:0,reduced:true}),'learn','reduce-motion must not disable navigation gestures');
});
test('navigation direction follows published tab order, independent of legacy courses page',()=>{
 assert.equal(routeDirection('today','learn'),1);
 assert.equal(routeDirection('growth','today'),-1);
 assert.equal(routeDirection('learn','settings'),1);
});
