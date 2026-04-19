// Gentle, state- and time-of-day-aware subtitles for the Today view.
// State dominates; time of day adds flavor.

const PROMPTS = {
  empty: {
    any: [
      "A blank slate. What will you create?",
      "What matters most to you today?",
      "Start simple. What's your first step?",
      "No pressure. What feels important?",
      "Begin with what feels right.",
    ],
    morning: [
      "A fresh morning. Where to begin?",
      "What would make today feel complete?",
      "Ready for a gentle start?",
    ],
    midday: [
      "Midday. What's calling for your attention?",
      "Halfway in. What deserves your energy?",
    ],
    afternoon: [
      "The afternoon is yours. What feels worth starting?",
      "Still time. What would feel good to finish?",
    ],
    evening: [
      "Quiet evening. Anything pulling at you?",
      "Wind down soon. One thing left?",
    ],
    late_night: [
      "It's late. Leave a note for tomorrow?",
      "Rest matters too. Tomorrow is close.",
    ],
  },
  pending: {
    any: [
      "Pick one thing. Just one.",
      "Trust yourself. What needs doing?",
      "One task at a time. Which one first?",
      "Choose one thing to focus on.",
      "Small steps add up.",
    ],
    morning: [
      "A clear morning. Where do you start?",
      "First task of the day — which one?",
    ],
    midday: [
      "Midday. What has your attention?",
      "Keep it steady. What's next?",
    ],
    afternoon: [
      "Keep going. What's next?",
      "Pace yourself. One at a time.",
    ],
    evening: [
      "Winding down. One more, or enough for today?",
      "Gentle finish. What can wait?",
    ],
    late_night: [
      "It's late. What can wait until morning?",
      "Be kind to tomorrow-you.",
    ],
  },
  all_done: {
    any: [
      "Everything's done. Enjoy the quiet.",
      "All clear. Well done.",
      "The list is empty — the good kind.",
    ],
    morning: [
      "Done already. A good start to the day.",
      "Cleared before the day even got going.",
    ],
    midday: [
      "Finished before midday. Nice.",
    ],
    afternoon: [
      "All wrapped up. Take the afternoon.",
    ],
    evening: [
      "All done. Rest easy tonight.",
    ],
    late_night: [
      "Everything's done. Time to sleep.",
    ],
  },
}

function parseHHMM(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function getTimeOfDay(dayStart, now = new Date()) {
  const startMin = parseHHMM(dayStart)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const offset = (nowMin - startMin + 1440) % 1440

  // Windows (minutes from dayStart): 5h morning, 4h midday, 4h afternoon, 4h evening, 7h late night.
  if (offset < 300) return 'morning'
  if (offset < 540) return 'midday'
  if (offset < 780) return 'afternoon'
  if (offset < 1020) return 'evening'
  return 'late_night'
}

export function getListState(today) {
  if (today.length === 0) return 'empty'
  if (today.every((t) => t.done)) return 'all_done'
  return 'pending'
}

export function getTodaySubtitle({ today, dayStart, now = new Date() }) {
  const listState = getListState(today)
  const timeOfDay = getTimeOfDay(dayStart, now)
  const pool = [
    ...(PROMPTS[listState]?.any ?? []),
    ...(PROMPTS[listState]?.[timeOfDay] ?? []),
  ]
  if (pool.length === 0) return ''
  return pool[Math.floor(Math.random() * pool.length)]
}
