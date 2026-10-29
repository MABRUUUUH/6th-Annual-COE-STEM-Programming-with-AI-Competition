/* NEXUS browser-side game engine. No runtime services or build tools needed.
   NOTE: Browser storage is local to one browser/device, not a shared database.
   Human-confirmed actions are not automated video verification. */
(function(global){
  'use strict';
  const KEY='nexus_local_championship_v1';
  const id=()=>global.crypto?.randomUUID?.()||('local-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  const clone=s=>JSON.parse(JSON.stringify(s));
  const assert=(condition,message)=>{if(!condition)throw Error(message);};
  const now=()=>new Date().toISOString();
  const base=()=>({id:id(),teams:{A:'Comets',B:'Orbit'},players:[{name:'Player 1',team:'A'},{name:'Player 2',team:'B'}],scores:{A:0,B:0},events:[],round:1,createdAt:now(),updatedAt:now()});
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){throw Error('Browser storage is unavailable or full. Export your results and enable site storage.');}return clone(s);}
  function read(){let raw;try{raw=localStorage.getItem(KEY);}catch(e){throw Error('Browser storage is blocked. Please enable site storage.');}if(!raw)return null;try{const s=JSON.parse(raw);validateState(s);return s;}catch(e){throw Error('Saved championship could not be loaded: '+e.message);}}
  function validateSetup(teams,players){
    assert(teams&&typeof teams==='object','Enter both teams');
    assert(Array.isArray(players)&&players.length>=2&&players.length<=6,'Enter 2–6 players');
    const cleaned={};for(const t of ['A','B']){assert(typeof teams[t]==='string'&&teams[t].trim().length>0&&teams[t].trim().length<=24,'Team names must be 1–24 characters');cleaned[t]=teams[t].trim();}
    assert(cleaned.A.toLowerCase()!==cleaned.B.toLowerCase(),'Team names must be different');
    const seen=new Set();const counts={A:0,B:0};const roster=players.map(p=>{
      assert(p&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.trim().length<=24,'Player names must be 1–24 characters');
      assert(p.team==='A'||p.team==='B','Choose a valid team for every player');
      const name=p.name.trim(),lower=name.toLocaleLowerCase();assert(!seen.has(lower),'Player names must be unique');seen.add(lower);counts[p.team]++;return {name,team:p.team};
    });
    assert(counts.A>0&&counts.B>0,'Both teams need at least one player');return {teams:cleaned,players:roster};
  }
  function validateState(s){
    assert(s&&typeof s==='object'&&typeof s.id==='string','Invalid saved session');
    validateSetup(s.teams,s.players);
    assert(Array.isArray(s.events)&&s.events.length<=20000,'Invalid event log');
    assert(s.scores&&Number.isFinite(s.scores.A)&&Number.isFinite(s.scores.B),'Invalid scores');
    for(const e of s.events)assert(e&&['A','B'].includes(e.team)&&Number.isFinite(e.points)&&typeof e.description==='string'&&['VERIFIED','UNCERTAIN'].includes(e.status),'Invalid recorded event');
    const totals={A:0,B:0};for(const e of s.events)if(e.status==='VERIFIED')totals[e.team]+=e.points;
    assert(totals.A===s.scores.A&&totals.B===s.scores.B,'Saved scores do not match event history');
  }
  function scoreEvent(s,input){
    const {game,team,player}=input,details=input.details||{},description=input.description||'';
    assert(['football','memory','engineers','rhythm','protocol'].includes(game),'Invalid game');
    assert(team==='A'||team==='B','Invalid team');
    assert(typeof details==='object'&&details!==null&&!Array.isArray(details),'Invalid event details');
    assert((game==='protocol'&&player==='Family team')||s.players.some(p=>p.name===player&&p.team===team),'Select a player from the chosen team');
    let points=0,status='VERIFIED',source='Locally validated action',desc=description,extra=clone(details);
    if(game==='football'){
      const pointsByAction={'Referee-confirmed goal':5,'Successful pass':1,'Individual mission completed':3,'Potential goal — requires review':0};
      assert(Object.hasOwn(pointsByAction,description),'Invalid football action');points=pointsByAction[description];
      if(description==='Potential goal — requires review'){status='UNCERTAIN';source='Human review required';}else source='Human referee confirmation';
    }else if(game==='memory'){
      const match=/^Heritage question ([1-3]): (correct|incorrect) answer$/.exec(description);
      assert(match,'Invalid memory question');const index=Number(match[1])-1;
      assert(!s.events.some(e=>e.game==='memory'&&e.team===team&&e.details?.questionIndex===index),'Question already scored for this team');
      const answers=['Dallah coffee pot','Dhow boat','Date palm'];const selected=details.selected??details.answer;
      assert(typeof selected==='string'&&selected.length<=80,'Invalid memory answer');points=selected===answers[index]?10:0;
      desc=`Heritage question ${index+1}: ${points?'correct':'incorrect'} answer`;extra={questionIndex:index,selected};source='Local fixed-answer check';
    }else if(game==='engineers'){
      const height=details.heightCm,stable=details.stable;
      assert(typeof height==='number'&&Number.isFinite(height)&&height>=1&&height<=500&&typeof stable==='boolean','Enter a height of 1–500 cm and a stability result');
      points=Math.round(height)+(stable?10:0);desc=`Tower measured ${height} cm${stable?' and passed stability test':'; stability test failed'}`;source='Human-witnessed measurement';extra={heightCm:height,stable};
    }else if(game==='rhythm'){
      const intervals=details.intervalsMs;
      assert(Array.isArray(intervals)&&intervals.length===2&&intervals.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=80&&x<=5000),'Invalid rhythm tap intervals');
      const error=(Math.abs(intervals[0]-500)+Math.abs(intervals[1]-500))/2;points=error<80?10:error<180?6:0;desc=`Rhythm attempt: average interval error ${Math.round(error)} ms`;
      source='Locally measured tap intervals';extra={intervalsMs:intervals,averageErrorMs:Math.round(error)};
    }else{
      assert(!s.events.some(e=>e.game==='protocol'),'Final Protocol already awarded');
      const prior=[...new Set(s.events.filter(e=>e.status==='VERIFIED'&&e.points>0&&e.game!=='protocol').map(e=>e.game))];
      assert(prior.length>=2,'Earn points in two different trials first');points=15;desc='Cooperative Final Protocol completed';source='Local prerequisite validation';extra={prerequisiteTrials:prior};
    }
    const timestamp=now();return {id:id(),timestamp,displayTime:new Date(timestamp).toLocaleTimeString(),game,description:desc,points,team,player,source,confidence:status==='VERIFIED'?1:.35,status,details:extra};
  }
  // Async-compatible adapter. The UI can retain its existing request queue.
  async function request(path,payload){
    const url=new URL(path,'https://nexus.local'),parts=url.pathname.split('/').filter(Boolean);
    assert(parts[0]==='api'&&parts[1]==='sessions','Unknown local endpoint');
    if(parts.length===2&&payload!==undefined){let s=read();if(!s){s=base();save(s);}return clone(s);}
    let s=read();assert(s,'Session not found');
    assert(parts[2]===s.id,'Session not found');
    if(parts.length===3&&payload===undefined)return clone(s);
    assert(payload&&typeof payload==='object','Invalid request');
    const action=parts[3];
    if(action==='setup'){
      assert(s.events.length===0,'Reset scores before editing an active lineup');
      const cleaned=validateSetup(payload.teams,payload.players);s.teams=cleaned.teams;s.players=cleaned.players;
    }else if(action==='events'){
      assert(s.events.length<20000,'Event history limit reached. Export and reset the game.');
      const ev=scoreEvent(s,payload);s.events.push(ev);if(ev.status==='VERIFIED')s.scores[ev.team]+=ev.points;
    }else if(action==='reset'){
      s.events=[];s.scores={A:0,B:0};s.round=(s.round||1)+1;
    }else throw Error('Unknown game action');
    s.updatedAt=now();return save(s);
  }
  function exportSave(){const s=read();assert(s,'No championship to export');return JSON.stringify({format:'NEXUS-CHAMPIONSHIP-v1',session:s},null,2);}
  function importSave(contents){assert(typeof contents==='string'&&contents.length<5000000,'Invalid or oversized file');let doc;try{doc=JSON.parse(contents);}catch(e){throw Error('File must contain valid JSON');}assert(doc?.format==='NEXUS-CHAMPIONSHIP-v1','Not a NEXUS backup file');validateState(doc.session);return save(doc.session);}
  global.NEXUSStore={request,exportSave,importSave};
})(window);
