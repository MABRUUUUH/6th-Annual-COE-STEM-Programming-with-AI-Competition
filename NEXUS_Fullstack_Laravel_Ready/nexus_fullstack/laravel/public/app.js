(() => {
  const $ = id => document.getElementById(id);
  const games = {
    football:{title:'Orbital Football',eyebrow:'TRIAL 01 / REQUIRED',description:'Record match events with a timestamped evidence trail.'},
    memory:{title:'Heritage Memory',eyebrow:'TRIAL 02 / MEMORY',description:'Study the scene, then answer questions to earn map fragments.'},
    engineers:{title:'Titan Engineers',eyebrow:'TRIAL 03 / BUILD',description:'Record your tower measurement and stability test.'},
    rhythm:{title:'Echo Rhythm',eyebrow:'TRIAL 04 / RHYTHM',description:'Tap along to a beat and compare your timing.'},
    protocol:{title:'The Final Protocol',eyebrow:'TRIAL 05 / CO-OP',description:'Use verified achievements to unlock the cooperative finale.'}
  };
  const API = '/api/sessions';
  let sessionId = localStorage.getItem('nexus_session_id');
  let requestQueue = Promise.resolve();
  let initialized = false;
  async function api(path, payload) {
    const response = await fetch(path, {method: payload === undefined ? 'GET' : 'POST', headers:{'Content-Type':'application/json'}, ...(payload === undefined ? {} : {body:JSON.stringify(payload)})});
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return result.data;
  }
  function applyState(s){
    players=s.players.map(p=>({...p})); scores={...s.scores}; events=[...s.events].reverse();
    $('teamAName').value=s.teams.A; $('teamBName').value=s.teams.B;
    renderPlayers(); renderScore(); renderEvents();
  }
  async function initialize(){
    try{ let state;
      if(sessionId){try{state=await api(`${API}/${sessionId}`);}catch(e){if(e.message.includes('not found')||e.message.includes('Session')){sessionId=null;}else throw e;}}
      if(!state){state=await api(API,{});sessionId=state.id;localStorage.setItem('nexus_session_id',sessionId);}
      applyState(state); initialized=true; toast('Connected · championship saved on server');
    }catch(e){toast(`Cannot connect to server: ${e.message}`);console.error(e);}
  }
  function enqueue(action){ requestQueue=requestQueue.catch(()=>{}).then(async()=>{
    if(!initialized)throw Error('Server is not connected');
    const state=await action();applyState(state);return state;
  }).catch(e=>{toast(`Not saved: ${e.message}`);console.error(e);throw e;});return requestQueue; }
  let players = [{name:'Player 1',team:'A'},{name:'Player 2',team:'B'}];
  let currentGame = 'football', events = [], scores = {A:0,B:0}, timerInterval = null, timerSeconds = 90, memoryScore = 0, rhythm = {target:[], taps:[], active:false, started:0};
  const playerName = (team='A') => players.find(p=>p.team===team)?.name || players[0]?.name || 'Player 1';
  const teamName = team => team === 'A' ? ($('teamAName')?.value || 'Comets') : ($('teamBName')?.value || 'Orbit');
  function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400);}
  function showView(id){stopTimer();document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(id).classList.add('active');window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});document.title=`${id==='homeView'?'Family AI Game Day':id==='resultsView'?'Championship Results':id==='setupView'?'Team Setup':games[currentGame].title} — NEXUS`;}
  function renderPlayers(){
    $('playersList').innerHTML='';
    players.forEach((p,i)=>{
      const row=document.createElement('div');row.className='player-row';
      row.innerHTML=`<input aria-label="Player ${i+1} name" maxlength="24" value="${escapeHtml(p.name)}" placeholder="Player name"><select aria-label="Player ${i+1} team"><option value="A" ${p.team==='A'?'selected':''}>Team A</option><option value="B" ${p.team==='B'?'selected':''}>Team B</option></select><button class="remove-player" aria-label="Remove player" ${players.length<=2?'disabled':''}>×</button>`;
      row.querySelector('input').addEventListener('input',e=>{p.name=e.target.value;renderRoster();});
      row.querySelector('select').addEventListener('change',e=>{p.team=e.target.value;renderRoster();});
      row.querySelector('button').addEventListener('click',()=>{if(players.length>2){players.splice(i,1);renderPlayers();}});
      $('playersList').appendChild(row);
    });
    $('addPlayerBtn').disabled=players.length>=6;
    renderRoster();
  }
  function renderRoster(){
    const target=$('teamRoster');if(!target)return;
    target.innerHTML=['A','B'].map(team=>{const members=players.filter(p=>p.team===team);return `<div class="roster-team"><span>${escapeHtml(teamName(team))} · TEAM ${team}</span><strong>${members.length} ${members.length===1?'player':'players'}</strong><small>${members.length?members.map(p=>escapeHtml(p.name.trim()||'Unnamed player')).join(' · '):'Assign a player to this team'}</small></div>`;}).join('');
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function addEvent({description,points=0,team='A',player=playerName(),game=currentGame,details={}}){
    // The backend recalculates points; browser-provided point values are advisory only.
    const input={description,points,team,player,game,details};
    if(game==='memory'){
      const q=/Heritage question ([1-3])/.exec(description);
      if(q)input.details={...details,questionIndex:Number(q[1])-1};
    }
    enqueue(()=>api(`${API}/${sessionId}/events`,input)).then(()=>{
      toast(`Event saved for ${teamName(team)}`);
      if(currentGame==='protocol')renderGame();
    }).catch(()=>{});
  }
  function renderScore(){
    $('scoreA').textContent=scores.A;$('scoreB').textContent=scores.B;
    $('scoreTeamAName').textContent=teamName('A');$('scoreTeamBName').textContent=teamName('B');
  }
  function renderEvents(){
    $('eventCount').textContent=`${events.length} EVENTS`;
    const target=$('eventLog');
    if(!events.length){target.innerHTML='<div class="empty-state">No events yet. Verified actions will appear here with their source and score.</div>';return;}
    target.innerHTML=events.map(e=>`<div class="event-item"><div class="event-time">${escapeHtml(e.displayTime)}</div><div><strong>${escapeHtml(e.description)}</strong><p>${escapeHtml(e.player||'Team event')} · ${escapeHtml(e.source)} · Confidence ${(e.confidence*100).toFixed(0)}%</p><p>${escapeHtml(e.status)} · ${escapeHtml(games[e.game]?.title||e.game)}</p></div><div class="event-points">${e.status==='VERIFIED'?(e.points>=0?'+':'')+e.points:'NOT SCORED'}</div></div>`).join('');
  }
  function selectGame(game){
    currentGame=game;const meta=games[game];$('gameTitle').textContent=meta.title;$('gameEyebrow').textContent=meta.eyebrow;$('gameDescription').textContent=meta.description;
    $('timerDisplay').textContent='01:30';timerSeconds=90;stopTimer();$('timerBtn').textContent='Start timer';
    renderScore();renderGame();renderEvents();showView('gameView');
  }
  function playerOptions(){return players.map((p,i)=>`<option value="${i}" data-team="${p.team}">${escapeHtml(p.name)} — ${escapeHtml(teamName(p.team))}</option>`).join('');}
  function chosenPlayer(selectId){const index=Number($(selectId).value);return players[index]?.name||playerName();}
  function wireTeamPlayer(teamId,playerId){const team=$(teamId),player=$(playerId);if(!team||!player)return;const sync=()=>{const matching=Array.from(player.options).filter(opt=>opt.dataset.team===team.value);Array.from(player.options).forEach(opt=>opt.hidden=opt.dataset.team!==team.value);if(matching.length&&!matching.some(opt=>opt.value===player.value))player.value=matching[0].value;};team.addEventListener('change',sync);sync();}
  function teamOptions(){return `<option value="A">${escapeHtml(teamName('A'))}</option><option value="B">${escapeHtml(teamName('B'))}</option>`;}
  function renderGame(){
    const c=$('gameContent');
    if(currentGame==='football'){
      c.innerHTML=`<h2>Match control</h2><p>Use this control panel to log a referee-confirmed event from your match footage. Uploading a clip does not automatically detect goals in this prototype.</p><div class="field-row"><label>Team</label><select id="eventTeam">${teamOptions()}</select><label>Player</label><select id="eventPlayer">${playerOptions()}</select></div><div class="field-row"><label>Optional video evidence</label><input class="game-input" id="footballVideo" type="file" accept="video/*" style="max-width:100%"></div><div id="videoInfo" class="muted"></div><div class="action-row"><button class="primary-btn" data-football="goal">⚽ Goal +5</button><button class="ghost-btn" data-football="pass">Successful pass +1</button><button class="ghost-btn" data-football="mission">Mission complete +3</button><button class="ghost-btn" data-football="uncertain">Flag uncertain call</button></div>`;
      wireTeamPlayer('eventTeam','eventPlayer');
      $('footballVideo').addEventListener('change',e=>{$('videoInfo').textContent=e.target.files[0]?`Selected local clip: ${e.target.files[0].name}. No upload occurred.`:'';});
      c.querySelectorAll('[data-football]').forEach(btn=>btn.addEventListener('click',()=>{
        const type=btn.dataset.football,team=$('eventTeam').value,player=chosenPlayer('eventPlayer');
        const names={goal:'Referee-confirmed goal',pass:'Successful pass',mission:'Individual mission completed',uncertain:'Potential goal — requires review'};
        const pts={goal:5,pass:1,mission:3,uncertain:5};
        addEvent({description:names[type],points:pts[type],team,player,source:type==='uncertain'?'Manual review required':'Referee-confirmed match event',confidence:type==='uncertain'?.35:1,status:type==='uncertain'?'UNCERTAIN':'VERIFIED'});
      }));
    } else if(currentGame==='memory'){
      memoryScore=0;
      c.innerHTML=`<h2>Observe the heritage scene</h2><p>Study these objects for 90 seconds. Then answer the questions from memory. This prototype uses a fixed scene and answer key.</p><div class="field-row"><label for="memoryTeam">Playing team</label><select id="memoryTeam">${teamOptions()}</select><label for="memoryPlayer">Player</label><select id="memoryPlayer">${playerOptions()}</select></div><div class="memory-scene"><div class="memory-object">☕<span>Dallah coffee pot</span></div><div class="memory-object">🌴<span>Date palm</span></div><div class="memory-object">🧺<span>Woven basket</span></div><div class="memory-object">🧴<span>Perfume bottle</span></div><div class="memory-object">🗡️<span>Khanjar</span></div><div class="memory-object">⛵<span>Dhow boat</span></div></div><div id="memoryQuestion"><button class="primary-btn" id="beginMemory">Hide scene & begin questions</button></div><div class="meter"><span id="memoryMeter"></span></div><p id="memoryFeedback">Map fragments unlocked: 0 / 3</p>`;
      wireTeamPlayer('memoryTeam','memoryPlayer');
      $('beginMemory').addEventListener('click',()=>{$('gameContent').querySelector('.memory-scene').hidden=true;askMemory(0);});
    } else if(currentGame==='engineers'){
      c.innerHTML=`<h2>Tower challenge</h2><p>Build a tower from household objects. Measure it with a ruler, then run a 10-second hands-off stability test. Enter your measurements; a human witness confirms the result.</p><div class="field-row"><label>Team</label><select id="buildTeam">${teamOptions()}</select><label>Builder</label><select id="buildPlayer">${playerOptions()}</select></div><div class="field-row"><label>Height (cm)</label><input class="game-input" id="towerHeight" type="number" min="1" max="500" value="30"></div><div class="field-row"><label>Stood for 10 seconds?</label><select id="towerStable"><option value="yes">Yes — stable</option><option value="no">No — collapsed / moved</option></select></div><div class="action-row"><button class="primary-btn" id="submitTower">Submit witnessed measurement</button></div><p>Scoring: 1 point per centimetre, plus 10 stability points if it stands through the test. This is a user-entered measurement, not automated camera estimation.</p>`;
      wireTeamPlayer('buildTeam','buildPlayer');
      $('submitTower').addEventListener('click',()=>{const h=Number($('towerHeight').value),team=$('buildTeam').value,player=chosenPlayer('buildPlayer'),stable=$('towerStable').value==='yes';if(!Number.isFinite(h)||h<1||h>500){toast('Enter a height between 1 and 500 cm.');return;}addEvent({description:`Tower measured ${h} cm${stable?' and passed stability test':'; stability test failed'}`,points:Math.round(h)+(stable?10:0),team,player,source:'User measurement + witnessed stability test',details:{heightCm:h,stable}});});
    } else if(currentGame==='rhythm'){
      rhythm={target:[0,500,1000],taps:[],active:false,started:0};
      c.innerHTML=`<h2>Repeat the pattern</h2><p>Listen to the three-beat pattern, then tap the button in the same rhythm. Your tap times are measured locally in this browser.</p><div class="field-row"><label>Team</label><select id="rhythmTeam">${teamOptions()}</select><label>Player</label><select id="rhythmPlayer">${playerOptions()}</select></div><div class="action-row"><button class="primary-btn" id="playBeat">▶ Play reference beat</button><button class="ghost-btn" id="tapBeat" disabled>● TAP</button><button class="ghost-btn" id="scoreRhythm" disabled>Score attempt</button></div><p id="rhythmFeedback">Target pattern: three beats, 500 ms apart.</p>`;
      wireTeamPlayer('rhythmTeam','rhythmPlayer');
      $('playBeat').addEventListener('click',playBeat);$('tapBeat').addEventListener('click',()=>{if(rhythm.active){rhythm.taps.push(performance.now()-rhythm.started);$('rhythmFeedback').textContent=`Captured ${rhythm.taps.length} / 3 taps.`;if(rhythm.taps.length>=3)$('scoreRhythm').disabled=false;}});
      $('scoreRhythm').addEventListener('click',scoreRhythm);
    } else {
      const verifiedGames=new Set(events.filter(e=>e.status==='VERIFIED'&&e.points>0&&e.game!=='protocol').map(e=>e.game));
      const unlocked=verifiedGames.size>=2;const alreadyCompleted=events.some(e=>e.game==='protocol'&&e.status==='VERIFIED');
      c.innerHTML=`<h2>Cooperative unlock</h2><p>The final protocol requires verified achievements in at least two earlier trials. Each trial counts only if it has at least one verified positive-point event.</p><div class="result-card"><span>PREVIOUS TRIALS WITH VERIFIED POINTS</span><strong>${verifiedGames.size} / 4</strong><p>${unlocked?'Protocol unlocked. Work together to finish the sequence.':'Complete two different earlier trials to unlock.'}</p></div><div class="field-row"><label for="protocolTeam">Award finale points to</label><select id="protocolTeam">${teamOptions()}</select></div><div class="action-row"><button class="primary-btn" id="protocolBtn" ${unlocked&&!alreadyCompleted?'':'disabled'}>Unlock final protocol +15</button><button class="ghost-btn" id="showKeys">Show required keys</button></div><p id="protocolMessage"></p>`;
      $('protocolBtn').addEventListener('click',()=>{addEvent({description:'Cooperative Final Protocol completed',points:15,team:$('protocolTeam').value,player:'Family team',source:'Unlocked by verified achievements in two earlier trials',details:{prerequisiteTrials:[...verifiedGames]}});$('protocolBtn').disabled=true;});
      $('showKeys').addEventListener('click',()=>$('protocolMessage').textContent=`Verified trials available: ${[...verifiedGames].map(g=>games[g].title).join(', ')||'none yet'}.`);
    }
  }
  const questions=[
    {q:'Which object was used to serve Arabic coffee?',answers:['Dallah coffee pot','Woven basket','Dhow boat','Date palm'],correct:0},
    {q:'Which object is a traditional sailing vessel?',answers:['Perfume bottle','Dhow boat','Khanjar','Coffee pot'],correct:1},
    {q:'Which plant appeared in the scene?',answers:['Olive tree','Date palm','Cedar','Bamboo'],correct:1}
  ];
  function askMemory(i){
    if(i>=questions.length){$('memoryQuestion').innerHTML=`<h3>Memory round complete</h3><p>You earned ${memoryScore} points and unlocked ${memoryScore/10} map fragments.</p>`;return;}
    const q=questions[i];$('memoryQuestion').innerHTML=`<h3>Question ${i+1} of ${questions.length}</h3><p>${q.q}</p><div class="answer-grid">${q.answers.map((a,j)=>`<button class="answer-btn" data-answer="${j}">${a}</button>`).join('')}</div>`;
    $('memoryQuestion').querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click',()=>{const correct=Number(btn.dataset.answer)===q.correct;if(correct){memoryScore+=10;addEvent({description:`Heritage question ${i+1}: correct answer`,points:10,team:$('memoryTeam').value,player:chosenPlayer('memoryPlayer'),source:'Compared with fixed answer key',details:{question:q.q,answer:q.answers[q.correct]}});}else addEvent({description:`Heritage question ${i+1}: incorrect answer`,points:0,team:$('memoryTeam').value,player:chosenPlayer('memoryPlayer'),source:'Compared with fixed answer key',details:{question:q.q,selected:q.answers[Number(btn.dataset.answer)]}});$('memoryMeter').style.width=`${memoryScore/30*100}%`;$('memoryFeedback').textContent=`Map fragments unlocked: ${memoryScore/10} / 3`;askMemory(i+1);}));
  }
  function playBeat(){
    rhythm.taps=[];rhythm.active=false;$('scoreRhythm').disabled=true;$('tapBeat').disabled=true;$('playBeat').disabled=true;
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(AudioCtx){const ctx=new AudioCtx();[0,500,1000].forEach(ms=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=660;gain.gain.value=.08;osc.connect(gain);gain.connect(ctx.destination);osc.start(ctx.currentTime+ms/1000);osc.stop(ctx.currentTime+ms/1000+.12);});}
    else toast('Audio playback is not supported; use the tap control after the pattern.');
    setTimeout(()=>{rhythm.active=true;rhythm.started=performance.now();$('tapBeat').disabled=false;$('playBeat').disabled=false;$('rhythmFeedback').textContent='Your turn: tap three times at the same interval.';},1600);
  }
  function scoreRhythm(){
    if(rhythm.taps.length!==3){toast('Capture three taps first.');return;}
    const intervals=[rhythm.taps[1]-rhythm.taps[0],rhythm.taps[2]-rhythm.taps[1]];
    const error=intervals.reduce((s,v)=>s+Math.abs(v-500),0)/2;
    const points=error<80?10:error<180?6:0;
    addEvent({description:`Rhythm attempt: average interval error ${Math.round(error)} ms`,points,team:$('rhythmTeam').value,player:chosenPlayer('rhythmPlayer'),source:'Browser tap timestamps compared with 500 ms target',confidence:1,details:{intervalsMs:intervals,averageErrorMs:Math.round(error)}});
    $('rhythmFeedback').textContent=`Average interval error: ${Math.round(error)} ms. Score: ${points} points.`;$('scoreRhythm').disabled=true;$('tapBeat').disabled=true;rhythm.active=false;
  }
  function startTimer(){
    if(timerInterval){stopTimer();$('timerBtn').textContent='Resume timer';return;}
    $('timerBtn').textContent='Pause timer';
    timerInterval=setInterval(()=>{timerSeconds--;const mm=String(Math.floor(timerSeconds/60)).padStart(2,'0'),ss=String(timerSeconds%60).padStart(2,'0');$('timerDisplay').textContent=`${mm}:${ss}`;if(timerSeconds<=0){stopTimer();$('timerBtn').textContent='Time complete';toast('Trial timer complete.');}},1000);
  }
  function stopTimer(){if(timerInterval){clearInterval(timerInterval);timerInterval=null;}}
  function showResults(){
    stopTimer();const sum=window.NEXUSJudge.summarize(events);const winner=scores.A===scores.B?'Tie':scores.A>scores.B?teamName('A'):teamName('B');
    $('resultsSummary').innerHTML=`<div class="result-card"><span>${escapeHtml(teamName('A').toUpperCase())}</span><strong>${scores.A} pts</strong><p>Team A total</p></div><div class="result-card"><span>${escapeHtml(teamName('B').toUpperCase())}</span><strong>${scores.B} pts</strong><p>Team B total</p></div><div class="result-card"><span>CHAMPIONSHIP LEADER</span><strong>${escapeHtml(winner)}</strong><p>${sum.eventCount} logged events · ${sum.totalPoints} total scored points</p></div>`;
    $('resultsLog').innerHTML=events.length?events.map(e=>`<div class="event-item"><div class="event-time">${escapeHtml(e.displayTime)}</div><div><strong>${escapeHtml(e.description)}</strong><p>${escapeHtml(e.player||'Team event')} · ${escapeHtml(e.source)} · ${escapeHtml(e.status)} · ${(e.confidence*100).toFixed(0)}% confidence</p></div><div class="event-points">${e.status==='VERIFIED'?(e.points>=0?'+':'')+e.points:'NOT SCORED'}</div></div>`).join(''):'<div class="empty-state">No events recorded yet.</div>';
    showView('resultsView');
  }
  $('startBtn').addEventListener('click',()=>{renderPlayers();showView('setupView');});
  $('howBtn').addEventListener('click',()=>$('howDialog').showModal());
  $('closeHow').addEventListener('click',()=>$('howDialog').close());
  $('dialogStart').addEventListener('click',()=>{$('howDialog').close();renderPlayers();showView('setupView');});
  $('addPlayerBtn').addEventListener('click',()=>{if(players.length<6){players.push({name:`Player ${players.length+1}`,team:players.length%2?'B':'A'});renderPlayers();}});
  $('saveSetupBtn').addEventListener('click',()=>{const cleaned=players.map(p=>({...p,name:p.name.trim()}));if(cleaned.some(p=>!p.name)){toast('Every player needs a name.');return;}if(new Set(cleaned.map(p=>p.name.toLocaleLowerCase())).size!==cleaned.length){toast('Give each player a unique name.');return;}if(!cleaned.some(p=>p.team==='A')||!cleaned.some(p=>p.team==='B')){toast('Assign at least one player to each team.');return;}if(!$('teamAName').value.trim()||!$('teamBName').value.trim()){toast('Name both teams.');return;}if($('teamAName').value.trim().toLowerCase()===$('teamBName').value.trim().toLowerCase()){toast('Choose different team names.');return;}players=cleaned;enqueue(()=>api(`${API}/${sessionId}/setup`,{teams:{A:$('teamAName').value.trim(),B:$('teamBName').value.trim()},players:cleaned})).then(()=>{showView('homeView');toast('Teams saved on server.');}).catch(()=>{});});
  document.querySelectorAll('[data-game]').forEach(btn=>btn.addEventListener('click',()=>selectGame(btn.dataset.game)));
  document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
  $('timerBtn').addEventListener('click',startTimer);
  $('playAgainBtn').addEventListener('click',()=>showView('homeView'));
  $('resetScoresBtn').addEventListener('click',()=>{if(!window.confirm('Start a new game? This clears BOTH team scores, the evidence log, and trial progress. Export the current results first if you need them.'))return;enqueue(()=>api(`${API}/${sessionId}/reset`,{})).then(()=>{stopTimer();memoryScore=0;rhythm={target:[],taps:[],active:false,started:0};timerSeconds=90;$('timerDisplay').textContent='01:30';$('timerBtn').textContent='Start timer';showView('setupView');toast('Scores reset on server.');}).catch(()=>{});});
  $('navResults')?.addEventListener('click',showResults);
  $('exportBtn').addEventListener('click',()=>{const report={project:'NEXUS — Family AI Game Day',team:'Team 260 / Code NULWO',generatedAt:new Date().toISOString(),scores:{[teamName('A')]:scores.A,[teamName('B')]:scores.B},events,limitations:['Prototype events are user-confirmed unless explicitly described otherwise.','Football goals are not automatically detected from video.','Tower height is user-entered; stability is witnessed.','No gameplay media is uploaded by this app.']};const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='nexus-championship-report.json';a.click();URL.revokeObjectURL(url);});
  document.querySelectorAll('.top-nav [data-view]').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
  $('teamAName').addEventListener('input',renderRoster);
  $('teamBName').addEventListener('input',renderRoster);
  renderPlayers();renderScore();initialize();
})();