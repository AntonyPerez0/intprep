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
      "Reviews make you answer before you see the solution: spot the pattern, then recall the code. While it's new you pick it from choices; once you know it, you type the key line, the missing lines or a whole part.",
  },
  {
    id: "generation-effect",
    title: "Pick first, then write it",
    icon: "pencil",
    finding:
      "Guidance helps most while material is new, and should fade as skill grows. Putting a solution's scrambled lines in order taught students as much as writing the same code, in less time. And people remember what they produce better than what they only read.",
    source: "Renkl & Atkinson (2003), Educational Psychologist; Ericson, Margulieux & Rick (2017), Koli Calling; Slamecka & Graf (1978), J. Experimental Psychology: Human Learning and Memory; Bertsch et al. (2007), Memory & Cognition",
    howWeUseIt:
      "New code starts as choices: you put a part's lines in order or pick each missing line. Once you know it, usually after its first review, you type it from memory, because producing code yourself is what makes it stick.",
  },
  {
    id: "spaced-repetition",
    title: "Spaced repetition",
    icon: "📅",
    finding:
      "Reviews spread over days beat the same amount of practice crammed together. In a study of over 1,350 people, the best gap between reviews grew the longer the material had to be remembered.",
    source: "Cepeda et al. (2008), Psychological Science",
    howWeUseIt:
      "Every problem you learn joins your review queue. An SM-2 style scheduler grades each review Forgot, Fuzzy, Got it or Easy from how you did, and waits longer after each success.",
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
      "Lessons walk from brute force to key insight to code, part by part, with hints if you need them. Help fades as you learn: you pick new code from choices, type it once known, and finish on a blank file.",
  },
  {
    id: "chunking",
    title: "Chunks and templates",
    icon: "📦",
    finding:
      "Experts see meaningful chunks, not single pieces: chess masters recall real positions at a glance but not random ones. Expert programmers likewise think in reusable plans, freeing working memory for what is new in a problem.",
    source: "Chase & Simon (1973), Cognitive Psychology",
    howWeUseIt:
      "Each pattern unit gives you a reusable code template and the cues that trigger it, and every solution is explained and practiced in small labeled parts, so you learn the plan behind the code.",
  },
  {
    id: "self-explanation",
    title: "Explain it to yourself",
    icon: "💬",
    finding:
      "Learners who explain to themselves why each step of an example works understand it better and solve new problems better. A meta-analysis of 64 reports found a medium-sized benefit from prompting self-explanation.",
    source: "Bisra et al. (2018), Educational Psychology Review",
    howWeUseIt:
      "Every part of the code comes with a plain-English why, and you rebuild it right after reading it. Insight-recall cards ask you to bring the key idea to mind before you check it against ours.",
  },
  {
    id: "parsons-problems",
    title: "Parsons problems",
    icon: "🧩",
    finding:
      "In a Parsons problem you put a solution's scrambled lines in order. With a few wrong lines mixed in, students solved them in significantly less time than writing or fixing the same code, with no difference in learning or in retention a week later.",
    source: "Parsons & Haden (2006), Australasian Computing Education Conference; Ericson, Margulieux & Rick (2017), Koli Calling",
    howWeUseIt:
      "While a problem's code is new, you build each part by putting its lines in order, with one look-alike line that does not belong. It is a stepping stone between recognizing a solution and writing it from memory.",
  },
  {
    id: "desirable-difficulties",
    title: "Desirable difficulties",
    icon: "💪",
    finding:
      "Practice that feels harder, such as testing, spacing and mixing, often produces better long-term learning, while smooth practice can hide how little will last. But a difficulty is only desirable if the learner can respond to it successfully.",
    source: "Bjork & Bjork (2011), Psychology and the Real World",
    howWeUseIt:
      "We choose recall over rereading, but keep it winnable: new code starts as choices, and typing takes over once you know it. A missed card comes back later in the same session, and the problem returns sooner.",
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
      "Each card trains one skill (spotting the pattern, recalling a key line, filling the gaps, building a part) with instant feedback, and problems you miss come back more often than ones you know well.",
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
