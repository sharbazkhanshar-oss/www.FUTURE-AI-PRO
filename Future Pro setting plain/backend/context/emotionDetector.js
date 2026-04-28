// ============================================================
// FUTURE AI PRO — emotionDetector.js
// Classifies emotional tone of user messages
// ============================================================

const VALID_EMOTIONS = ["neutral","curious","frustrated","anxious","enthusiastic","sad","confused"];

const SIGNALS = {
  frustrated:   [/doesn'?t work/i,/broken/i,/useless/i,/why won'?t/i,/keeps failing/i,/!!!+/,/so frustrat/i,/not working/i,/terrible/i],
  anxious:      [/worried/i,/scared/i,/not sure/i,/what if/i,/afraid/i,/nervous/i,/anxious/i,/stress/i,/overwhelm/i],
  curious:      [/how does/i,/why does/i,/what is/i,/i wonder/i,/\?{1,}/,/explain/i,/tell me/i,/curious/i,/how do/i],
  enthusiastic: [/amazing/i,/love this/i,/can'?t wait/i,/excited/i,/awesome/i,/!!!+/,/fantastic/i,/great/i,/excellent/i],
  sad:          [/\bsad\b/i,/depress/i,/hopeless/i,/crying/i,/\bmiss\b/i,/lonely/i,/unhappy/i,/miserable/i,/heartbroken/i],
  confused:     [/confused/i,/don'?t understand/i,/\blost\b/i,/unclear/i,/makes no sense/i,/what do you mean/i,/huh\?/i],
};

function classify(message) {
  if (typeof message !== "string") return { emotion: "neutral", confidence: 0, method: "heuristic" };

  const scores = {};
  for (const [emotion, patterns] of Object.entries(SIGNALS)) {
    let hits = 0;
    for (const pattern of patterns) {
      if (pattern.test(message)) hits++;
    }
    scores[emotion] = hits / patterns.length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] === 0) {
    return { emotion: "neutral", confidence: 1.0, method: "heuristic" };
  }

  return { emotion: best[0], confidence: Math.min(1, best[1] * 3), method: "heuristic" };
}

module.exports = { classify, VALID_EMOTIONS };
