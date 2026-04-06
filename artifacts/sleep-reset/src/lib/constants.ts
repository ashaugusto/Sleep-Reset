export const SLEEP_TYPES = {
  racing_thoughts: {
    id: "racing_thoughts",
    name: "The Overthinker",
    description: "Your brain doesn't know when to stop. You lie in bed and suddenly remember every embarrassing thing you did 5 years ago, or start planning out conversations you'll never have."
  },
  work_stress: {
    id: "work_stress",
    name: "The Stress Carrier",
    description: "Work follows you home and into bed. You're mentally answering emails and solving problems while staring at the ceiling."
  },
  partying_alcohol: {
    id: "partying_alcohol",
    name: "The Party Recoverer",
    description: "Your social life is great. Your sleep isn't. The late nights and drinks might feel good in the moment, but your body is fighting to recover the next day."
  },
  anxiety: {
    id: "anxiety",
    name: "The Anxious Sleeper",
    description: "Your nervous system forgets to clock out. You might not even know what you're anxious about, but your body is on high alert."
  },
  phone_screens: {
    id: "phone_screens",
    name: "The Screen Addict",
    description: "Your last memory of the day is a scroll. The blue light and constant dopamine hits are tricking your brain into thinking it's still daytime."
  },
  unknown: {
    id: "unknown",
    name: "The Mystery Sleeper",
    description: "You're not sure what's keeping you up, but something is. Don't worry, we'll figure it out together."
  }
} as const;

export type SleepTypeId = keyof typeof SLEEP_TYPES;
