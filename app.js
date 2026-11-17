const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='taladeck.v2';let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
S=Object.assign({user:null,decks:[],notes:[],sessions:0,bestStreak:0,dark:false,streak:0,last:'',today:{d:'',n:0},goal:20,sample:false},S||{});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
let toastT;const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200)};
const day=()=>new Date().toLocaleDateString('en-CA');
function undoToast(m,fn){const t=$('#toast');t.textContent=m+' — tap to undo';t.style.pointerEvents='auto';t.classList.add('show');t.onclick=()=>{fn();t.classList.remove('show');t.style.pointerEvents='';t.onclick=null};clearTimeout(toastT);toastT=setTimeout(()=>{t.classList.remove('show');t.style.pointerEvents='';t.onclick=null},5000)}
const names={home:'Home',flashcards:'My Flashcards',notes:'My Notes',study:'Study & Review',profile:'My Profile',settings:'Settings'};
function go(p){$$('.page').forEach(e=>e.classList.toggle('active',e.id==='page-'+p));$$('.sidebar .nav').forEach(b=>b.classList.toggle('active',b.dataset.page===p));$('#crumb').textContent=names[p];$('#sidebar').classList.remove('open');render()}
function modal(title,html,onSubmit){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modalBackdrop').classList.remove('hidden');const f=$('#modalBody form');if(f){f.onsubmit=e=>{e.preventDefault();onSubmit(f);};f.querySelector('input,textarea').focus()}}
const closeModal=()=>$('#modalBackdrop').classList.add('hidden');
function parseCards(t){return t.split('\n').map(l=>{const i=l.indexOf('|');return i<0?null:{q:l.slice(0,i).trim(),a:l.slice(i+1).trim()}}).filter(c=>c&&c.q&&c.a)}
function deckForm(d){
 const cards=d?d.cards.map(c=>({q:c.q,a:c.a,ch:c.ch})):[];
 modal(d?'Edit deck':'New deck',`<form class="form" id="deckEd"><label>Deck title<input name="t" required maxlength="60" value="${d?esc(d.title):''}"></label><div class="cardbox"><b>Add a card</b><label>Front — your note or question<textarea name="q" rows="2" placeholder="e.g. Capital of France"></textarea></label><label>Back — the answer<textarea name="a" rows="2" placeholder="e.g. Paris"></textarea></label><fieldset class="chs"><legend>Choices — at least 4, include the correct answer</legend><div id="chBox"></div><button type="button" class="outline" id="addCh">＋ Add choice</button></fieldset><button type="button" class="outline" id="addCard">＋ Add card</button><small>Tip: press Enter in the Back box to add the card, then type the next one.</small><details><summary>Paste many cards at once</summary><textarea name="bulk" rows="4" placeholder="Capital of France | Paris&#10;2 + 2 | 4"></textarea><button type="button" class="outline" id="bulkBtn">Import pasted cards</button></details></div><div id="cardList"></div><button class="primary">Save deck</button></form>`,ff=>{
  if((ff.q.value.trim()||ff.a.value.trim())&&!addCard())return;
  if(!cards.length)return toast('Add at least one card first');
  if(d){d.title=ff.t.value.trim();d.cards=cards}else S.decks.unshift({id:uid(),title:ff.t.value.trim(),cards,at:Date.now()});
  save();closeModal();render();toast('Deck saved')});
 const f=$('#deckEd'),list=$('#cardList');let ed=-1,ch=['','','',''];
 const drawCh=()=>{$('#chBox').innerHTML=ch.map((v,i)=>`<div class="row2" style="margin:4px 0"><input class="chi" data-ci="${i}" placeholder="Choice ${i+1}" value="${esc(v)}" style="flex:1">${i>3?`<button type="button" class="icon" data-cx="${i}" aria-label="Remove choice">×</button>`:''}</div>`).join('')};
 const draw=()=>{list.innerHTML=`<small>${cards.length} card${cards.length===1?'':'s'} in this deck</small>`+cards.map((c,i)=>`<div class="citem"><span><b>${esc(c.q)}</b><br><small>${esc(c.a)}${c.ch?' · '+c.ch.length+' choices':' · no custom choices'}</small></span><span class="row2" style="margin:0"><button type="button" class="outline" data-ed="${i}">Edit</button><button type="button" class="icon" data-rm="${i}" aria-label="Remove card">×</button></span></div>`).join('')};
 const addCard=()=>{const q=f.q.value.trim(),a=f.a.value.trim();if(!q||!a){toast('Fill in both the front and the back');return false}const cs=ch.map(x=>x.trim()).filter(Boolean);
 if(cs.length<4){toast('Add at least 4 choices');return false}
 if(new Set(cs.map(norm)).size<cs.length){toast('Choices must all be different');return false}
 if(!cs.some(x=>norm(x)===norm(a))){toast('One of the choices must be the correct answer');return false}
 const was=ed>=0;if(was){cards[ed]={q,a,ch:cs};ed=-1;$('#addCard').textContent='＋ Add card'}else cards.push({q,a,ch:cs});f.q.value=f.a.value='';ch=['','','',''];drawCh();draw();f.q.focus();toast(was?'Card updated':'Card added');return true};
 $('#addCard').onclick=addCard;
 $('#bulkBtn').onclick=()=>{const n=parseCards(f.bulk.value);if(!n.length)return toast('Use one card per line: question | answer');cards.push(...n);f.bulk.value='';draw();toast(n.length+' cards imported')};
 list.onclick=e=>{const b=e.target.closest('[data-rm]'),g=e.target.closest('[data-ed]');if(b){cards.splice(+b.dataset.rm,1);if(ed>=0){ed=-1;ch=['','','',''];drawCh();f.q.value=f.a.value='';$('#addCard').textContent='＋ Add card'}draw()}if(g){ed=+g.dataset.ed;f.q.value=cards[ed].q;f.a.value=cards[ed].a;ch=[...(cards[ed].ch||[])];while(ch.length<4)ch.push('');drawCh();$('#addCard').textContent='✓ Update card';f.q.focus()}};
 f.t.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();f.q.focus()}};
 f.a.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addCard()}};
 $('#addCh').onclick=()=>{if(ch.length>=8)return toast('Up to 8 choices');ch.push('');drawCh();$('#chBox').querySelector('[data-ci="'+(ch.length-1)+'"]').focus()};
 $('#chBox').oninput=e=>{if(e.target.dataset.ci)ch[+e.target.dataset.ci]=e.target.value};
 $('#chBox').onclick=e=>{const x=e.target.closest('[data-cx]');if(x){ch.splice(+x.dataset.cx,1);drawCh()}};
 $('#chBox').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const n=e.target.closest('.row2').nextElementSibling;if(n)n.querySelector('input').focus()}};
 f.a.addEventListener('blur',()=>{const a=f.a.value.trim();if(a&&!ch.some(x=>norm(x)===norm(a))){const i=ch.findIndex(x=>!x.trim());if(i>=0){ch[i]=a;drawCh()}}});
 drawCh();draw()}
function noteForm(n){modal(n?'Edit note':'New note',`<form class="form"><label>Title<input name="t" required maxlength="80" value="${n?esc(n.title):''}"></label><label>Content<textarea name="c" rows="8" required>${n?esc(n.body):''}</textarea></label><button class="primary">Save note</button></form>`,f=>{if(n){n.title=f.t.value.trim();n.body=f.c.value}else S.notes.unshift({id:uid(),title:f.t.value.trim(),body:f.c.value,at:Date.now()});save();closeModal();render();toast('Note saved')})}
function render(){
 const u=S.user||{name:'Student',user:'student'},ini=u.name[0].toUpperCase();
 ['sideAvatar','topAvatar','profileAvatar'].forEach(i=>$('#'+i).textContent=ini);
 $('#sideName').textContent=$('#topName').textContent=$('#profileHeading').textContent=u.name;$('#sideHandle').textContent='@'+u.user;
 $('#greeting').textContent='Hello, '+u.name+'!';$('#today').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
 $('#deckCount').textContent=S.decks.length;$('#noteCount').textContent=S.notes.length;$('#sessionCount').textContent=S.decks.length;$('#bestStreak').textContent=S.bestStreak;
 const tn=S.today&&S.today.d===day()?S.today.n:0,yd=new Date(Date.now()-864e5).toLocaleDateString('en-CA'),st=(S.last===day()||S.last===yd)?S.streak:0;
 $('#goalTxt').textContent=Math.min(tn,S.goal)+' / '+S.goal+' cards today';$('#goalBar').style.width=Math.min(100,tn/S.goal*100)+'%';$('#dayStreak').textContent=st?'🔥 '+st+'-day study streak':'Study today to start a streak';
 $('#recentDecks').innerHTML=S.decks.slice(0,3).map(d=>`<button class="recent" data-study="${d.id}"><span style="flex:1"><b>${esc(d.title)}</b><br><small>${d.cards.length} cards</small></span>Study</button>`).join('')||'<div class="empty">No decks yet. Create your first one.</div>';
 const dq=$('#deckSearch').value.toLowerCase(),ds=S.decks.filter(d=>(d.title+' '+d.cards.map(c=>c.q+' '+c.a).join(' ')).toLowerCase().includes(dq)).sort((a,b)=>!!b.pin-!!a.pin);
 $('#deckCountLabel').textContent=ds.length+' deck'+(ds.length===1?'':'s');
 $('#deckGrid').innerHTML=ds.map(d=>`<article class="card"><h3>${esc(d.title)}</h3><small>${d.cards.length} cards</small><p>${esc(d.cards.slice(0,3).map(c=>c.q).join('\n'))}</p><div class="row"><button class="primary" data-study="${d.id}">Study</button><button class="outline" data-pin="${d.id}" aria-label="Pin deck">${d.pin?'★':'☆'}</button><button class="outline" data-edit-deck="${d.id}">Edit</button><button class="outline danger" data-del-deck="${d.id}">Delete</button></div></article>`).join('')||'<div class="empty">No decks found.</div>';
 const nq=$('#noteSearch').value.toLowerCase(),ns=S.notes.filter(n=>(n.title+n.body).toLowerCase().includes(nq));
 $('#noteCountLabel').textContent=ns.length+' note'+(ns.length===1?'':'s');
 $('#noteGrid').innerHTML=ns.map(n=>`<article class="card"><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p><div class="row"><button class="outline" data-edit-note="${n.id}">Edit</button><button class="outline danger" data-del-note="${n.id}">Delete</button></div></article>`).join('')||'<div class="empty">No notes found.</div>';
 $('#studyChoices').innerHTML=S.decks.map(d=>`<button class="choice" data-study="${d.id}"><b>${esc(d.title)}</b><small>${d.cards.length} cards</small></button>`).join('')||'<div class="empty">Create a deck first.</div>';
 $('#dark').checked=S.dark;document.body.classList.toggle('dark',S.dark);
}
/* ---------- Gimkit-style typed-answer round ---------- */
let G=null,MODE='type',LM={id:'',cards:[]};
const norm=t=>t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();
function lev(a,b){const m=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=m[0];m[0]=i;for(let j=1;j<=b.length;j++){const t=m[j];m[j]=Math.min(m[j]+1,m[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return m[b.length]}
const isRight=(a,k)=>{a=norm(a);k=norm(k);return a===k||(k.length>5&&a.length>0&&lev(a,k)<=1)};
const MOTIVE={hi:['Outstanding! Your hard work is showing.','You really know this one. Keep that momentum going!','Excellent recall. Be proud of how far you’ve come.','Brilliant! Consistency like this builds real mastery.','Look at you go! Challenge yourself with a bigger deck next.'],mid:['Great job! A little more practice and it’ll be second nature.','You’re getting there. Every review makes it stick a bit more.','Solid effort. The cards you missed are the ones that will help you grow.','Nice progress! One more round and you’ll feel the difference.','You’re closer than you think. Keep showing up!'],lo:['Every expert started right where you are. Keep going!','Mistakes are how learning happens. Try another round when you’re ready.','You showed up, and that’s what counts. Take a breath and go again.','Don’t be discouraged. Your brain is building new connections right now.','Small steps still move you forward. You’ve got this!']};
let lastMotive='';
const motive=a=>{const l=MOTIVE[a>=80?'hi':a>=50?'mid':'lo'].filter(m=>m!==lastMotive);return lastMotive=l[Math.random()*l.length|0]};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function startStudy(id,only){const d=S.decks.find(x=>x.id===id);if(!d||!d.cards.length)return;const src=only||d.cards;
 G={d,mode:(MODE==='choice'&&d.cards.length<2)?'type':MODE,queue:shuffle(src.map(c=>({q:c.q,a:c.a,ch:c.ch}))),total:src.length,done:0,streak:0,best:0,hit:0,miss:0,retype:null,missedCards:[],opts:null,flipped:false};
 if(!$('#page-study').classList.contains('active'))go('study');drawStudy()}
function hud(){return `<div class="bar"><i style="width:${G.done/G.total*100}%"></i></div>`}
function drawStudy(msg,cls){const box=$('#studyBox');
 if(G.queue.length===0){S.sessions++;S.bestStreak=Math.max(S.bestStreak||0,G.best);save();render();
  const acc=Math.round(G.hit/Math.max(1,G.hit+G.miss)*100);
  box.innerHTML=`<div class="results"><small>Round complete</small><h2>${esc(G.d.title)}</h2><div class="big">${acc}%</div><p class="muted">correct on first look · best streak ${G.best} · ${G.miss} missed</p><p class="motive">✦ ${motive(acc)}</p><button class="primary" data-study="${G.d.id}">Play again</button> ${G.missedCards.length?`<button class="outline" data-retry="1">Retry missed (${G.missedCards.length})</button>`:''} <button class="outline" id="stopBtn">Choose another deck</button></div>`;LM={id:G.d.id,cards:G.missedCards};G=null;return}
 const c=G.queue[0],re=G.retype;let body;
 if(G.mode==='flip')body=`${G.flipped?`<div class="qcard">${esc(c.a)}</div><div class="row2"><button class="primary" data-flip="1">I knew it</button><button class="outline" data-flip="0">Missed it</button></div>`:'<button class="primary" data-show="1">Show answer</button>'}`;
 else if(G.mode==='choice'&&!re){const o=G.opts||(G.opts=c.ch&&c.ch.length>=4?shuffle(c.ch):shuffle([c.a,...shuffle(G.d.cards.map(x=>x.a).filter(a=>norm(a)!==norm(c.a))).slice(0,3)]));body=`<div class="opts">${o.map((a,i)=>`<button class="up" data-opt="${i}">${esc(a)}</button>`).join('')}</div>`}
 else body=`<form id="ansForm" autocomplete="off"><input class="ans ${re?'bad':''}" id="ans" placeholder="${re?'Type the correct answer to continue':'Type your answer and press Enter'}" aria-label="Your answer" autocapitalize="off" spellcheck="false"></form>${re?'':'<div class="row2"><button class="outline" type="button" id="hintBtn">Hint</button><button class="outline" type="button" id="skipBtn">I don’t know</button></div>'}`;
 box.innerHTML=`${hud()}<div class="qcard">${esc(c.q)} <button class="icon" type="button" data-say="1" aria-label="Read aloud">🔊</button></div>${body}<div class="fb ${cls||''}" aria-live="polite">${msg||''}</div>`;
 const i=$('#ans');if(i)i.focus()}
function submitAnswer(v){if(!G)return;const c=G.queue[0];v=v.trim();
 if(G.retype){if(norm(v)===norm(c.a)){G.retype=null;next();drawStudy('Got it. On to the next one.','')}else{const i=$('#ans');i.value='';i.classList.add('bad');$('.fb').textContent='Not quite. Correct answer: '+c.a;$('.fb').className='fb bad'}return}
 if(!v)return;
 if(isRight(v,c.a)){G.streak++;G.best=Math.max(G.best,G.streak);if(!c.seenMiss)G.hit++;next();drawStudy('Correct!','ok')}
 else wrong(c)}
function bump(){const d=day();if(!S.today||S.today.d!==d)S.today={d,n:0};S.today.n++;if(S.last!==d){const y=new Date(Date.now()-864e5).toLocaleDateString('en-CA');S.streak=S.last===y?(S.streak||0)+1:1;S.last=d}save()}
function next(){G.queue.shift();G.done++;G.opts=null;G.flipped=false;bump()}
function grade(ok){const c=G.queue[0];if(ok){G.streak++;G.best=Math.max(G.best,G.streak);if(!c.seenMiss)G.hit++}else{G.streak=0;if(!c.seenMiss){G.miss++;G.missedCards.push(c)}c.seenMiss=true}next();drawStudy(ok?'Nice!':'','ok')}
function wrong(c){G.streak=0;if(!c.seenMiss){G.miss++;G.missedCards.push(c)}c.seenMiss=true;G.retype=true;drawStudy('Answer: '+c.a+' — type it to move on.','bad')}
/* ---------- events ---------- */
document.addEventListener('click',e=>{const t=e.target.closest('button,a');if(!t)return;
 if(t.dataset.page){e.preventDefault();return go(t.dataset.page)}
 if(t.dataset.action==='new-deck')return deckForm();if(t.dataset.action==='new-note')return noteForm();
 if(t.dataset.study)return startStudy(t.dataset.study);
 if(t.dataset.editDeck)return deckForm(S.decks.find(d=>d.id===t.dataset.editDeck));
 if(t.dataset.editNote)return noteForm(S.notes.find(n=>n.id===t.dataset.editNote));
 if(t.dataset.delDeck){const i=S.decks.findIndex(d=>d.id===t.dataset.delDeck),[x]=S.decks.splice(i,1);save();render();undoToast('Deck deleted',()=>{S.decks.splice(i,0,x);save();render()})}
 if(t.dataset.delNote){const i=S.notes.findIndex(n=>n.id===t.dataset.delNote),[x]=S.notes.splice(i,1);save();render();undoToast('Note deleted',()=>{S.notes.splice(i,0,x);save();render()})}
 if(t.dataset.mode){MODE=t.dataset.mode;$$('.mode').forEach(b=>b.classList.toggle('on',b===t));return}
 if(t.dataset.retry)return startStudy(LM.id,LM.cards);
 if(t.dataset.pin){const d=S.decks.find(x=>x.id===t.dataset.pin);d.pin=!d.pin;save();render()}
 if(t.dataset.opt&&G){const c=G.queue[0];return norm(G.opts[+t.dataset.opt])===norm(c.a)?submitAnswer(c.a):wrong(c)}
 if(t.dataset.show&&G){G.flipped=true;return drawStudy()}
 if(t.dataset.flip&&G)return grade(t.dataset.flip==='1');
 if(t.dataset.say&&G){try{const u=new SpeechSynthesisUtterance(G.queue[0].q);speechSynthesis.cancel();speechSynthesis.speak(u)}catch(x){}}
 if(t.id==='hintBtn'&&G){const a=G.queue[0].a;$('.fb').textContent='Hint: starts with “'+a[0]+'” · '+a.length+' characters'}
 if(t.id==='skipBtn'&&G)wrong(G.queue[0]);
 if(t.id==='stopBtn'){$('#studyBox').innerHTML='<div class="empty"><div>✧</div><h2>Pick a deck to play.</h2></div>'}
 if(t.id==='modalClose')closeModal();
 if(t.id==='menuToggle')$('#sidebar').classList.toggle('open');});
document.addEventListener('submit',e=>{if(e.target.id==='ansForm'){e.preventDefault();submitAnswer($('#ans').value)}});
$('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
$('#deckSearch').oninput=$('#noteSearch').oninput=render;
$('#dark').onchange=e=>{S.dark=e.target.checked;save();render()};
$('#exportBtn').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='taladeck-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
$('#importFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.decks)||!Array.isArray(d.notes))throw 0;S=Object.assign(S,d);save();render();toast('Backup restored')}catch(x){toast('That file isn’t a TalaDeck backup')}};r.readAsText(f);e.target.value=''};
$('#profileForm').onsubmit=e=>{e.preventDefault();S.user={name:$('#displayName').value.trim(),user:$('#username').value.trim().replace(/^@/,'')};save();render();$('#profileFeedback').textContent='Profile saved.'};
$$('[data-page="profile"]').forEach(b=>b.addEventListener('click',()=>{const u=S.user||{name:'Student',user:'student'};$('#displayName').value=u.name;$('#username').value=u.user;$('#profileFeedback').textContent=''}));
if(!S.sample&&!S.decks.length){S.decks.push({id:uid(),title:'Sample: Getting started',cards:[{q:'What is the capital of France?',a:'Paris'},{q:'2 + 2',a:'4'},{q:'Largest planet in our solar system',a:'Jupiter'}],at:Date.now()});S.sample=true;save()}
render();
