// ─────────────────────────────────────────────────────────────────────────────
// The learning-science principles behind IntPrep, shown on the /science page.
//
// Every `source` was checked against its publisher record. The full write-up,
// with evidence strength, caveats and complete references, is in
// docs/LEARNING_SCIENCE.md. Keep `finding` ≤ 45 words and `howWeUseIt` ≤ 40.
// ─────────────────────────────────────────────────────────────────────────────

export interface SciencePrinciple {
  id: string;
  title: string;
  icon: string;
  finding: string;
  source: string;
  howWeUseIt: string;
}

export const SCIENCE: SciencePrinciple[] = [
  {
    id: "retrieval-practice",
    title: "Retrieval practice",
    icon: "🧠",
    finding:
      "Pulling an answer out of memory strengthens it far more than rereading. Students who practiced recalling a text remembered much more a week later than students who reread it, even though rereading looked better on a test five minutes later.",
    source: "Roediger & Karpicke (2006), Psychological Science",
    howWeUseIt:
      "Reviews make you produce the answer before you see it: spot the pattern, then write the key line, the missing lines or a whole part from memory. Code from memory goes up to the whole solution.",
  },
  {
    id: "generation-effect",
    title: "Write it, don't pick it",
    icon: "pencil",
    finding:
      "People remember what they produce themselves better than what they only read. In the classic experiments, words learners generated from a cue were remembered better than the same words read, and a later meta-analysis found the benefit across many studies.",
    source: "Slamecka & Graf (1978), J. Experimental Psychology: Human Learning and Memory; Bertsch et al. (2007), Memory & Cognition",
    howWeUseIt:
      "You write code rather than choose it: each lesson part (look, cover, write, check), the template after each pattern intro, and two coding cards per problem in reviews. Feedback comes line by line, and misses return in the same session.",
  },
  {
    id: "spaced-repetition",
    title: "Spaced repetition",
    icon: "📅",
    finding:
      "Reviews spread over days beat the same amount of practice crammed together. In a study of over 1,350 people, the best gap between reviews grew the longer the material had to be remembered.",
    source: "Cepeda et al. (2008), Psychological Science",
    howWeUseIt:
      "Every problem you learn joins your review queue. An SM-2 style scheduler grades each review Again, Hard, Good or Easy from how you did, and waits longer after each success.",
  },
  {
    id: "interleaving",
    title: "Mix it up",
    icon: "🔀",
    finding:
      "Mixing different problem types in one session feels harder than practicing one type at a time, but it teaches you to tell similar problems apart and pick the right strategy. A meta-analysis found a moderate benefit, largest for easily confused categories.",
    source: "Brunmair & Richter (2019), Psychological Bulletin",
    howWeUseIt:
      "Units teach one pattern at a time. Then daily review and Pattern Blitz shuffle patterns together, so you practice the real interview skill: spotting which pattern a new problem needs.",
  },
  {
    id: "pretesting",
    title: "Guess before you learn",
    icon: "🔮",
    finding:
      "Trying to answer before being taught improves learning of the answer, even when the guess is wrong. In five experiments, questions asked before reading beat extra study time.",
    source: "Richland, Kornell & Kao (2009), J. Experimental Psychology: Applied",
    howWeUseIt:
      "Each guided lesson asks you to predict the pattern before revealing anything. Wrong guesses cost nothing. Making the attempt is what helps the explanation stick.",
  },
  {
    id: "worked-examples",
    title: "Worked examples that fade",
    icon: "🪜",
    finding:
      "Beginners learn problem solving faster from fully worked examples than from struggling alone, because it frees working memory. As skill grows, guidance should fade: help that aids novices can hold more experienced learners back.",
    source: "Renkl & Atkinson (2003); Kalyuga et al. (2003), Educational Psychologist",
    howWeUseIt:
      "Lessons walk from brute force to key insight to code you write yourself, part by part. Progressive hints let you take only the help you need, and practice climbs from filling gaps to a blank file.",
  },
  {
    id: "chunking",
    title: "Chunks and templates",
    icon: "📦",
    finding:
      "Experts see meaningful chunks, not single pieces: chess masters recall real positions at a glance but not random ones. Expert programmers likewise think in reusable plans, freeing working memory for what is new in a problem.",
    source: "Chase & Simon (1973), Cognitive Psychology",
    howWeUseIt:
      "Each pattern unit gives you a reusable code template and the cues that trigger it, and every solution is explained and written in small labeled parts, so you learn the plan behind the code.",
  },
  {
    id: "self-explanation",
    title: "Explain it to yourself",
    icon: "💬",
    finding:
      "Learners who explain to themselves why each step of an example works understand it better and solve new problems better. A meta-analysis of 64 reports found a medium-sized benefit from prompting self-explanation.",
    source: "Bisra et al. (2018), Educational Psychology Review",
    howWeUseIt:
      "Every part of the code comes with a plain-English why, and you write it from memory right after reading it. Insight-recall cards ask you to bring the key idea to mind before you check it against ours.",
  },
  {
    id: "parsons-problems",
    title: "Parsons problems",
    icon: "🧩",
    finding:
      "Putting the scrambled lines of a solution in order took students significantly less time than writing or fixing the same code, with no difference in learning or in retention a week later.",
    source: "Ericson, Margulieux & Rick (2017), Koli Calling",
    howWeUseIt:
      "The steps-in-order card in reviews is a stepping stone between recognizing a solution and writing it from memory.",
  },
  {
    id: "desirable-difficulties",
    title: "Desirable difficulties",
    icon: "💪",
    finding:
      "Practice that feels harder, such as testing, spacing and mixing, often produces better long-term learning. Smooth, fluent practice can lift today's performance while hiding how little will last.",
    source: "Bjork & Bjork (2011), Psychology and the Real World",
    howWeUseIt:
      "We choose writing code over rereading it and tell you when struggle is a good sign. A missed card comes back later in the same session, and the problem returns sooner.",
  },
  {
    id: "calibration",
    title: "Know what you know",
    icon: "📏",
    finding:
      "Learners often feel they know material better than they do, and overconfident students stop studying too early and remember less. Checking yourself against real answers keeps confidence honest.",
    source: "Dunlosky & Rawson (2012), Learning and Instruction",
    howWeUseIt:
      "The scheduler grades reviews from what you actually got right, not only how sure you felt, so shaky problems come back sooner.",
  },
  {
    id: "deliberate-practice",
    title: "Deliberate practice",
    icon: "🎯",
    finding:
      "Skill grows fastest from focused practice on specific weaknesses with immediate feedback, not just hours logged. A later meta-analysis found practice matters but explains less than once claimed, so quality beats quantity.",
    source: "Ericsson et al. (1993); Macnamara et al. (2014)",
    howWeUseIt:
      "Each card trains one skill (spotting the pattern, writing a key line, filling the gaps, writing a part) with instant feedback, and problems you miss come back more often than ones you know well.",
  },
  {
    id: "flow",
    title: "Flow and the sweet spot",
    icon: "🌊",
    finding:
      "People are most absorbed when challenge matches skill, goals are clear and feedback is immediate. A computational study suggests learning is fastest when about 85% of practice answers are correct.",
    source: "Csikszentmihalyi (1990), Flow; Wilson et al. (2019), Nature Communications",
    howWeUseIt:
      "Short sessions, a clear daily goal, instant feedback after every answer and the combo meter keep you in the zone, and reviews return just as a problem starts to fade.",
  },
  {
    id: "motivation",
    title: "Motivation that lasts",
    icon: "🧭",
    finding:
      "Game elements improve learning modestly on average, but rewards that feel controlling can crowd out real interest. Elements that build a sense of competence, choice and connection, such as progress graphs, work best.",
    source: "Sailer & Homner (2020), Educational Psychology Review",
    howWeUseIt:
      "XP, levels, crowns and achievements reflect real learning, you choose your own daily goal, and charts show your growing mastery, so the game supports the learning instead of replacing it.",
  },
  {
    id: "habits",
    title: "Habits and forgiving streaks",
    icon: "🔥",
    finding:
      "Daily repetition in a consistent context makes a behavior automatic, often in about two months, and missing a single day did not derail it. Goals with a small emergency reserve that costs something to use keep people going longer.",
    source: "Lally et al. (2010), Eur. J. Social Psychology; Sharif & Shu (2017), J. Marketing Research",
    howWeUseIt:
      "Your streak rewards showing up each day. Streak freezes, bought with gems you earn by practicing, cover the odd missed day, because one slip should never undo a habit.",
  },
];
