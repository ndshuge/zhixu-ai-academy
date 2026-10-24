(()=>{'use strict';
if(window.__ZHIXU_SIMPLE_HOME)return;window.__ZHIXU_SIMPLE_HOME=true;
const $=id=>document.getElementById(id),content=document.querySelector('.shell>main .content');if(!content)return;
document.body.classList.add('zx-home-v2');
const bar=document.createElement('div');bar.id='zx-home-bar';
bar.innerHTML='<div><strong>知序 AI 学院</strong></div><div><button id="zx-home-back" hidden>返回首页</button><button id="zx-home-settings">设置</button></div>';
const home=document.createElement('section');home.id='zx-home-screen';
home.innerHTML='<h1>先预测，再验证。</h1><p>完成前测、科学实验与独立迁移。</p><div class="zx-choice-grid"><button type="button" id="zx-guided" class="zx-choice featured"><span class="zx-icon">01</span><strong>新手引导</strong><p>从独立前测开始，沿着一条完整学习路径，逐步了解知序怎样帮助你思考。</p><em>开始学习 →</em></button><button type="button" id="zx-free" class="zx-choice"><span class="zx-icon">✧</span><strong>自由探索</strong><p>直接选择两个真实科学世界，自己提出问题、设置变量并观察实验。</p><em>选择科学世界 →</em></button></div><div id="zx-lab-chooser" hidden><h2>选择你想探索的世界</h2><div class="zx-lab-grid"><a href="./explore.html?lab=pfl"><span>∿</span><strong>PFL · 非线性动力学</strong><p>初值只有一点不同，长期轨迹为什么会分离？</p><em>进入物理世界 ↗</em></a><a href="./explore.html?lab=evo"><span>✧</span><strong>EvoWorld · 生命演化</strong><p>改变合作条件，演化过程和群体结构会怎样变化？</p><em>进入生命世界 ↗</em></a></div></div>';
const workspace=document.createElement('section');workspace.id='zx-learning-workspace';workspace.hidden=true;
for(const n of [...content.children])workspace.append(n);
content.append(bar,home,workspace);
const progress=document.createElement('div');progress.id='zx-learning-progress';progress.innerHTML='<div class="zx-progress-label"><strong>本次学习进度</strong><span id="zx-progress-text">01 / 04 · 独立前测</span></div><div class="zx-progress-track"><div id="zx-progress-fill"></div></div>';workspace.prepend(progress);
const guideHeading=document.createElement('div');guideHeading.id='zx-guide-heading';guideHeading.innerHTML='<h1>先作预测，再看证据</h1>';const evidenceSection=workspace.querySelector('.evidence-lens');if(evidenceSection)evidenceSection.before(guideHeading);else progress.after(guideHeading);
const settings=document.createElement('div');settings.id='zx-settings-modal';settings.hidden=true;settings.innerHTML='<div id="zx-settings-panel" role="dialog" aria-modal="true" aria-label="知序设置"><header><h2>设置与工具</h2><button id="zx-settings-close">关闭</button></header><p>辅助入口集中在这里，学习时不再分散注意力。</p><div id="zx-settings-links"></div></div>';document.body.append(settings);
const target=$('zx-settings-links'),rail=document.querySelector('.rail .rail-bottom');
if(rail){while(rail.firstChild)target.append(rail.firstChild)}
const ai=document.createElement('a');ai.href='./connect.html';ai.textContent='管理 DeepSeek AI 连接';target.prepend(ai);
function homeMode(){home.hidden=false;workspace.hidden=true;$('zx-home-back').hidden=true;window.scrollTo(0,0)}
function learningMode(){home.hidden=true;workspace.hidden=false;$('zx-home-back').hidden=false;window.scrollTo(0,0);updateProgress()}
function updateProgress(){let n=1;if(document.querySelector('#transfer:not(.hidden)'))n=4;else if(document.querySelector('#results:not(.hidden)'))n=3;else if($('prediction-input')?.value?.trim())n=2;const names=['独立前测','提出预测','实验与证据','迁移复习'];$('zx-progress-text').textContent=String(n).padStart(2,'0')+' / 04 · '+names[n-1];$('zx-progress-fill').style.width=n*25+'%'}
$('zx-home-back').onclick=homeMode;$('zx-guided').onclick=()=>{learningMode();if($('focus-toggle')?.getAttribute('aria-pressed')!=='true')$('focus-toggle')?.click();window.scrollTo({top:0,left:0,behavior:'instant'});requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));};
$('zx-free').onclick=()=>{$('zx-lab-chooser').hidden=false;$('zx-lab-chooser').scrollIntoView({behavior:'smooth',block:'nearest'})};
$('zx-home-settings').onclick=()=>{settings.hidden=false;$('zx-settings-close').focus()};$('zx-settings-close').onclick=()=>settings.hidden=true;settings.onclick=e=>{if(e.target===settings)settings.hidden=true};document.addEventListener('keydown',e=>{if(e.key==='Escape')settings.hidden=true});document.addEventListener('click',()=>setTimeout(updateProgress,100));document.addEventListener('input',updateProgress);
if(new URLSearchParams(location.search).has('focus'))learningMode();
window.__ZHIXU_HOME_API={showHome:homeMode,showGuide:learningMode};

 // zx-ai-status-config-click-v1: the existing AI status pill is the configuration entry.
const aiStatus=$('model-state');
if(aiStatus){
  const statusStyle=document.createElement('style');
  statusStyle.textContent='#model-state{cursor:pointer;user-select:none;transition:box-shadow .16s,border-color .16s}#model-state:hover{border-color:#8bc7ab;box-shadow:0 0 0 3px #dff3e7}#model-state:focus-visible{outline:3px solid #2c8c68;outline-offset:3px}';
  document.head.appendChild(statusStyle);
  aiStatus.setAttribute('role','button');
  aiStatus.setAttribute('tabindex','0');
  aiStatus.setAttribute('aria-label','点击配置 AI 模型连接');
  aiStatus.title='点击配置 AI 模型连接';
  const openAiConfig=()=>{
    const dialog=$('pages-ai-dialog');
    if(dialog){dialog.dataset.open='true';const keyInput=$('pages-ai-key');if(keyInput)keyInput.focus();return;}
    const launcher=$('pages-ai-open');
    if(launcher){launcher.click();return;}
    const settings=$('zx-settings-modal');
    if(settings){settings.hidden=false;const link=$('zx-settings-links')?.querySelector('a[href*="connect.html"]');if(link)link.focus();}
  };
  aiStatus.addEventListener('click',openAiConfig);
  aiStatus.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openAiConfig();}});
}
document.documentElement.classList.remove('zx-first-paint');
})();
