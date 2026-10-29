/* NEXUS local judge utilities.
   This prototype validates explicit game events and stores evidence metadata.
   It is not a computer-vision model and does not automatically detect football goals. */
(() => {
  const NEXUSJudge = {
    rules: {
      football: { goal: 5, pass: 1, mission: 3 },
      memory: { correct: 10 },
      engineers: { stable: 10 },
      rhythm: { perfect: 10, good: 6, miss: 0 },
      protocol: { solved: 15 }
    },
    nowStamp() {
      const d = new Date();
      return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    },
    makeEvent({game, description, points=0, team, player, status='VERIFIED', source='User-confirmed action', confidence=1, details={}}) {
      return {
        id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
        timestamp: new Date().toISOString(),
        displayTime: this.nowStamp(),
        game, description, points, team, player, status, source,
        confidence: Math.max(0, Math.min(1, Number(confidence))),
        details
      };
    },
    validate(event) {
      if (!event || !event.game || !event.description || !Number.isFinite(event.points)) {
        return {valid:false, reason:'Missing required event fields.'};
      }
      if (event.status !== 'VERIFIED') return {valid:false, reason:'Only VERIFIED events may change scores.'};
      if (event.confidence < 0.6) return {valid:false, reason:'Confidence is below the scoring threshold.'};
      return {valid:true, reason:'Required fields and scoring threshold passed.'};
    },
    summarize(events) {
      return events.reduce((summary, event) => {
        summary.eventCount++;
        if (this.validate(event).valid) {
          summary.totalPoints += event.points;
          if (event.team) summary.byTeam[event.team] = (summary.byTeam[event.team] || 0) + event.points;
          if (event.player) summary.byPlayer[event.player] = (summary.byPlayer[event.player] || 0) + event.points;
        }
        return summary;
      }, {eventCount:0,totalPoints:0,byTeam:{},byPlayer:{}});
    }
  };
  window.NEXUSJudge = NEXUSJudge;
})();