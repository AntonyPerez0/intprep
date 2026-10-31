# The learning science behind IntPrep

IntPrep aims to take someone with little or no coding knowledge to confident mastery of the 150 classic
interview problems, and to make the daily work enjoyable enough that they keep coming back. This document
explains **which research findings each feature rests on**, **what the evidence actually says** (including
its limits), and **the design rules that follow from it**.

It is written for contributors. When you add a feature or change a mechanic, check it against the relevant
section. If you are thinking of a change that the research argues against, the "Risks and mitigations"
section (Part C) is the place to start.

**How to read the evidence labels**

| Label | Meaning |
|---|---|
| **Strong** | Replicated in many experiments and supported by at least one meta-analysis or major review. |
| **Moderate** | Good experimental support, but fewer studies, smaller effects, or results that depend on conditions. |
| **Emerging** | A handful of studies, often in one domain (for example, computing education), so promising but not settled. |
| **Industry** | Company-reported A/B tests (for example, Duolingo's blog). These are useful for product design but not peer-reviewed. |

Every source cited here was checked against its publisher record (Crossref DOI metadata, the publisher's
page, or the original blog post). Full references are at the end.

---

## Contents

- [At a glance: features mapped to principles](#at-a-glance-features-mapped-to-principles)
- **Part A: How memory and skill are built**
  1. [Retrieval practice (the testing effect)](#1-retrieval-practice-the-testing-effect)
  2. [Spacing and spaced-repetition scheduling](#2-spacing-and-spaced-repetition-scheduling)
  3. [Interleaving: learning to tell patterns apart](#3-interleaving-learning-to-tell-patterns-apart)
  4. [Worked examples, faded guidance and cognitive load](#4-worked-examples-faded-guidance-and-cognitive-load)
  5. [Parsons problems](#5-parsons-problems)
  6. [Pretesting, generation and productive failure](#6-pretesting-generation-and-productive-failure)
  7. [Desirable difficulties](#7-desirable-difficulties)
  8. [Self-explanation](#8-self-explanation)
  9. [Chunking, schemas and code templates](#9-chunking-schemas-and-code-templates)
  10. [Deliberate practice](#10-deliberate-practice)
  11. [Metacognition and calibrated confidence](#11-metacognition-and-calibrated-confidence)
  12. [Feedback: what to show, and when](#12-feedback-what-to-show-and-when)
  13. [Teaching absolute beginners to program](#13-teaching-absolute-beginners-to-program)
- **Part B: Motivation, fun and habit**
  14. [Flow and the difficulty sweet spot](#14-flow-and-the-difficulty-sweet-spot)
  15. [Self-determination theory](#15-self-determination-theory)
  16. [What the gamification research shows](#16-what-the-gamification-research-shows)
  17. [What Duolingo has published about streaks, goals and leagues](#17-what-duolingo-has-published-about-streaks-goals-and-leagues)
  18. [Behavioural levers: goal gradient, endowed progress, loss aversion, fresh starts, slack](#18-behavioural-levers)
  19. [Habit formation](#19-habit-formation)
- **Part C: [Making it fun without hurting learning](#part-c-making-it-fun-without-hurting-learning)**
  - [Risks and mitigations](#risks-and-mitigations)
  - [IntPrep's gamification rules](#intpreps-gamification-rules)
  - [IntPrep's review-scheduling rules](#intpreps-review-scheduling-rules)
- **Part D: [Books, and what we take from each](#part-d-books-and-what-we-take-from-each)**
- [References](#references)

---

## At a glance: features mapped to principles

| IntPrep feature | Main principles (section numbers) |
|---|---|
| Beginner foundations track (Python, Big-O, recursion, problem-solving framework) | Beginners need guidance (4), tracing before writing (13), explicit problem-solving steps (13), chunking (9) |
| Pattern unit intro (analogy, recognition cues, template, quiz) | Schemas and templates (9), worked examples (4), retrieval (1), interleaving needs clear categories first (3) |
| Guided lesson: predict the pattern first | Pretesting (6), calibration (11) |
| Guided lesson: progressive hints | Faded guidance (4), productive struggle (6), expertise reversal (4) |
| Guided lesson: brute force, then key insight, then algorithm | Worked examples (4), contrasting cases (3), self-explanation (8) |
| Guided lesson: chunked code walkthrough | Chunking (9), subgoal labels (4), self-explanation (8) |
| Guided lesson: complexity check, order-the-steps quiz | Retrieval (1), Parsons problems (5) |
| Spaced-repetition review queue (SM-2 style, auto-graded) | Spacing (2), retrieval (1), successive relearning (2), calibration (11) |
| Interleaved daily drill | Interleaving (3), spacing (2), deliberate practice (10) |
| Drill: pattern-recognition multiple choice | Retrieval (1), interleaving (3), feedback on MC (12) |
| Drill: insight recall with self-rating | Retrieval (1), generation (6), calibration (11) |
| Drill: Parsons step ordering | Parsons problems (5) |
| Drill: key-line fill-in | Retrieval (1), generation (6), chunking (9) |
| Drill: complexity multiple choice | Retrieval (1), feedback (12) |
| Drill: rebuild the solution from memory | Recall beats recognition (1), desirable difficulty (7), deliberate practice (10) |
| Pattern Blitz (60 s, combo multiplier) | Interleaving (3), flow (14), fluency through retrieval (1); risks in Part C |
| XP, daily XP goal, levels, achievements | Gamification evidence (16), goal setting (18), self-determination theory (15) |
| Streak, streak freezes bought with gems | Habit formation (19), Duolingo data (17), emergency reserves (18), broken-streak effects (18) |
| Mastery crowns per problem (from review interval) | Spacing (2), competence feedback (15), goal gradient (18) |
| Confetti, sounds, haptics, combo meter | Juiciness and seductive details (Part C), flow (14) |
| Weekly XP chart, streak calendar | Performance graphs support competence (16), fresh-start effect (18) |

---

# Part A: How memory and skill are built

## 1. Retrieval practice (the testing effect)

**Evidence: Strong.**

**What the research says.** Pulling information out of memory strengthens it far more than reading it again.
In Roediger and Karpicke (2006), students who took recall tests on a passage remembered much more after two
days and after a week than students who restudied it, although restudying looked better on a test five
minutes later. Karpicke and Blunt (2011) found retrieval practice beat elaborate concept mapping, even on
inference questions. Meta-analyses confirm the effect is large and robust (Adesope et al., 2017; Rowland,
2014). It also transfers to new but related questions (d = 0.40; Pan & Rickard, 2018). Recall formats (producing
the answer) give larger benefits than recognition formats such as multiple choice (Rowland, 2014; Kang et al., 2007).
Dunlosky et al. (2013) rated practice testing one of only two "high utility" study techniques.

**Key sources.** Roediger & Karpicke (2006); Karpicke & Roediger (2008); Karpicke & Blunt (2011);
Rowland (2014); Adesope, Trevisan & Sundararajan (2017); Pan & Rickard (2018); Dunlosky et al. (2013).

**How IntPrep uses it.**
- Every drill asks the learner to *produce* something before showing the answer: the pattern name, the
  key insight, the missing key line, the step order, the complexity, or the whole solution.
- The order-the-steps quiz and complexity check at the end of each guided lesson are the first retrieval of
  that problem. The review queue then repeats retrieval on a spaced schedule.
- Because recall beats recognition, drills should **climb a format ladder** as a problem matures:
  recognition (pattern MC, complexity MC), then partial recall (Parsons, key-line fill-in), then full recall
  ("rebuild from memory"). The top mastery crowns should require a successful recall-format drill, not only
  multiple choice.

## 2. Spacing and spaced-repetition scheduling

**Evidence: Strong** (spacing). **Moderate** (specific scheduling algorithms).

**What the research says.** Spreading practice over time produces better long-term retention than massing the
same practice together (Cepeda et al., 2006). The best gap depends on how long you need to remember. In a study
of more than 1,350 people, the optimal gap between study sessions was about 20–40% of the retention interval
when the test was a week away, falling to about 5–10% when the test was a year away (Cepeda et al., 2008).
The spacing benefit holds for *retrieval* practice too, so spaced testing combines both effects (Latimier et al., 2021;
Carpenter et al., 2022). Rawson,
Dunlosky and Sciartelli (2013) showed that **successive relearning** works well in real courses: retrieve each
item correctly during practice, then relearn it again in several later spaced sessions.

**Scheduling algorithms.**
- **Leitner box (Leitner, 1972).** Flashcards move forward one compartment when answered correctly and go back
  to the first compartment when missed. Later compartments are reviewed less often. This is simple, transparent
  and easy to explain to learners.
- **SM-2 (Wozniak, 1990).** Each item has an "easiness factor" (EF, starting at 2.5, never below 1.3). Intervals are
  1 day, then 6 days, then the previous interval times EF. Answers are graded 0–5. A grade below 3 restarts the
  intervals without changing EF, and items graded below 4 are repeated at the end of the session until they reach 4.
  Anki's original scheduler descends from SM-2 and uses the four buttons Again, Hard, Good and Easy. Anki's manual
  stresses that **Hard is a passing grade**, not a failure.
- **Half-life regression (Settles & Meeder, 2016).** Duolingo's machine-learned model estimates the "half-life" of
  each word in a learner's memory. It cut prediction error by more than 45% against baselines and raised daily
  engagement by 12% in an operational test.
- **FSRS (Ye, Su & Cao, 2022; Su et al., 2023).** The Free Spaced Repetition Scheduler models each item's
  difficulty, stability and retrievability, and fits its parameters to the learner's review history. It has been
  built into Anki since version 23.10. Its default target ("desired retention") is 90%.

**Key sources.** Cepeda et al. (2006, 2008); Kang (2016); Latimier, Peyre & Ramus (2021); Carpenter, Pan & Butler
(2022); Rawson, Dunlosky & Sciartelli (2013); Wozniak (1990); Settles & Meeder (2016); Ye, Su & Cao (2022).

**How IntPrep uses it.**
- Every problem a learner finishes enters the review queue with an SM-2-style schedule. The app grades each
  review Again, Hard, Good or Easy from performance (see the [scheduling rules](#intpreps-review-scheduling-rules)).
- Items answered "Again" come back **later in the same session** until answered correctly once (SM-2's
  end-of-session repeat and the successive-relearning criterion), then return the next day.
- Mastery crowns are derived from the current review interval, so a crown means "you have remembered this across
  a long gap", which is an honest signal of durable learning.
- SM-2 is a good, explainable starting point. If enough review data builds up, FSRS can replace it. The
  open-spaced-repetition project publishes an open-source TypeScript implementation (ts-fsrs).

## 3. Interleaving: learning to tell patterns apart

**Evidence: Strong** for category and problem-type discrimination. **Moderate** overall (depends on material).

**What the research says.** Interleaving means mixing different problem types in one practice session instead of
doing a block of one type. Blocked practice lets learners skip the hardest step, *deciding which strategy applies*,
because the chapter title gives it away (Rohrer, 2012). Shuffled maths practice made practice sessions harder but
produced much better test scores a week later (Rohrer & Taylor, 2007), and a classroom randomised trial found the
same (Rohrer, Dedrick & Stershic, 2015). People learned painters' styles better when paintings were interleaved,
yet still rated blocking as more effective, even after their own test results showed the opposite (Kornell & Bjork, 2008). A meta-analysis found a moderate
overall effect (g = 0.42), larger when categories look similar to each other (Brunmair & Richter, 2019). Blocking
was better for simple word lists, so interleaving is not universal.

**Key sources.** Rohrer & Taylor (2007); Kornell & Bjork (2008); Rohrer (2012); Rohrer, Dedrick & Stershic (2015);
Brunmair & Richter (2019).

**How IntPrep uses it.**
- Each pattern unit is taught as a block first, so the learner has a clear idea of the category before mixing.
- The **interleaved daily drill** and **Pattern Blitz** shuffle problems from every pattern the learner has
  studied. Identifying the pattern is exactly the discrimination skill an interview tests.
- The mix should **favour confusable pairs** (for example, two pointers vs. sliding window, BFS vs. DFS,
  1-D DP vs. greedy), because that is where interleaving helps most. Problems with an `alsoAccept` pattern
  are good contrast cases.
- Tell learners why the mixed drill feels harder, since people misjudge interleaving as less effective.

## 4. Worked examples, faded guidance and cognitive load

**Evidence: Strong** (worked-example effect and expertise reversal).

**What the research says.** Working memory can only juggle a few new elements at once. Novices who solve problems
by trial and error spend that capacity on searching, not on learning the underlying schema (Sweller, 1988).
Studying worked examples is often faster and more effective for beginners (Sweller & Cooper, 1985; Atkinson et
al., 2000), and minimal-guidance discovery tends to fail novices (Kirschner, Sweller & Clark, 2006). The benefit
reverses with expertise: techniques that help beginners can become redundant or harmful for more experienced
learners (the **expertise-reversal effect**; Kalyuga et al., 2003). Renkl and Atkinson (2003) recommend **fading**,
removing worked steps one at a time until the learner solves problems alone. In programming, labelling each
group of steps with its purpose ("subgoal labels") improved novices' problem solving (Morrison, Margulieux &
Guzdial, 2015).

**Key sources.** Sweller (1988); Sweller & Cooper (1985); Atkinson et al. (2000); Renkl & Atkinson (2003);
Kalyuga et al. (2003); Kirschner, Sweller & Clark (2006); Sweller, van Merriënboer & Paas (2019);
Morrison, Margulieux & Guzdial (2015).

**How IntPrep uses it.**
- Guided lessons are worked examples: brute force, then key insight, then step-by-step algorithm, then a
  chunked code walkthrough. The `#@` chunk explanations in the content format work as subgoal labels.
- **Progressive hints** (gentle, then strong) let each learner take only as much guidance as they need.
- **Fading across a unit:** the first problem in a pattern should be fully worked; later problems in the same
  unit can start with the walkthrough collapsed and invite an attempt first.
- **Fading across reviews:** the drill format ladder (Section 1) removes scaffolding as the review interval grows.
- **Expertise reversal:** learners who already know a pattern (high accuracy in its drills) should be able to skip
  straight to "try it, then check", rather than sit through the full walkthrough.

## 5. Parsons problems

**Evidence: Emerging to Moderate** (computing education).

**What the research says.** A Parsons problem gives the correct code as scrambled blocks to put in order (Parsons &
Haden, 2006). Students solved two-dimensional Parsons problems with distractor lines significantly faster than
fixing or writing the equivalent code, with no difference in learning or retention a week later (Ericson,
Margulieux & Rick, 2017). Adaptive versions that become easier when a learner struggles were also more efficient than writing the
equivalent code, and just as effective (Ericson, Foley & Rick, 2018). Parsons scores correlate notably with code-writing scores and show more clearly what
a student does not know (Denny, Luxton-Reilly & Simon, 2008). A 2022 working-group review summarises the evidence
and its gaps (Ericson et al., 2022).

**Key sources.** Parsons & Haden (2006); Denny, Luxton-Reilly & Simon (2008); Ericson, Margulieux & Rick (2017);
Ericson, Foley & Rick (2018); Ericson et al. (2022).

**How IntPrep uses it.**
- The **order-the-steps quiz** (plain-English steps) ends each guided lesson.
- The **Parsons drill** in reviews sits between recognition and full recall on the format ladder.
- Add **code-line Parsons with one or two distractor lines** (for example an off-by-one bound or a wrong
  pointer move) and indentation, as in Ericson's studies. If the learner makes two wrong moves, make it
  easier by merging two blocks or removing a distractor (adaptive Parsons).

## 6. Pretesting, generation and productive failure

**Evidence: Strong** (generation effect). **Moderate** (pretesting). **Moderate, with conditions** (productive failure).

**What the research says.** Trying to answer *before* being taught improves learning, even when the attempt fails:
learners who were asked questions before reading a passage learned those answers better than learners given extra
study time (Richland, Kornell & Kao, 2009; Kornell, Hays & Bjork, 2009). Information you generate yourself is
remembered better than information you only read (the generation effect; Slamecka & Graf, 1978; Bertsch et al.,
2007). Productive failure, struggling with a problem before instruction, beat instruction-first in a meta-analysis
of 53 studies (g = 0.36; Sinha & Kapur, 2021). The same meta-analysis found that younger learners and
domain-general skills favoured instruction first, so struggle helps most when learners have enough prior knowledge
to make a real attempt (Kapur, 2016).

**Key sources.** Richland, Kornell & Kao (2009); Kornell, Hays & Bjork (2009); Slamecka & Graf (1978); Bertsch et al.
(2007); Kapur (2008, 2016); Sinha & Kapur (2021).

**How IntPrep uses it.**
- **Predict the pattern first.** Each guided lesson opens with a low-stakes guess. Wrong guesses must cost nothing:
  no XP loss and no effect on the streak. You can even award a little XP for making the guess.
- **Brute force before the insight.** Asking "what is the obvious way?" is a generation step and sets up the
  contrast that makes the key insight meaningful.
- **Key-line fill-in** and **insight recall** are generation tasks.
- **Attempt-first mode** (productive failure) should be offered once a learner has some knowledge of the pattern,
  for example after the first problem in a unit. It should not be forced on complete beginners.

## 7. Desirable difficulties

**Evidence: Strong** (as an umbrella for Sections 1–3 and 6).

**What the research says.** Bjork (1994) called conditions that slow down practice but improve long-term learning
"desirable difficulties": retrieval instead of rereading, spacing, interleaving, and generation. Performance during
practice is an unreliable guide to learning: easy, fluent practice can raise today's scores while producing little
lasting learning, and the reverse is also true (Soderstrom & Bjork, 2015). Learners tend to read effort as a sign
that a strategy is not working, and so avoid the strategies that help most (Kirk-Johnson, Galla & Fraundorf, 2019).
A difficulty is only *desirable* if the learner can eventually succeed; impossible tasks just frustrate.

**Key sources.** Bjork (1994); Bjork & Bjork (2011); Soderstrom & Bjork (2015); Kirk-Johnson, Galla & Fraundorf (2019).

**How IntPrep uses it.**
- IntPrep favours effortful drills (recall, rebuild, mixed practice) over rereading solutions.
- **Normalise struggle in the UI copy**, for example "Feeling stuck? That effort is what makes it stick." Show the
  learner their long-term retention (crowns kept) so effort is visibly connected to results.
- Keep difficulties achievable: hints are always available, and the scheduler aims for a high but not perfect
  success rate (Section 14).

## 8. Self-explanation

**Evidence: Strong.**

**What the research says.** Students who explain to themselves *why* each step of a worked example works learn more
and solve new problems better (Chi et al., 1989). Prompting learners to self-explain improves understanding (Chi et
al., 1994). A meta-analysis of 64 reports found a medium-sized benefit (g = 0.55; Bisra et al., 2018).

**Key sources.** Chi, Bassok, Lewis, Reimann & Glaser (1989); Chi, De Leeuw, Chiu & LaVancher (1994); Bisra, Liu,
Nesbit, Salimi & Winne (2018).

**How IntPrep uses it.**
- Each code chunk is paired with a plain-English "why", modelling the explanation we want learners to make.
- **Ask before telling:** on key lines (`#!`), ask "Why is this line needed?" with three short options before
  showing the explanation. This is quick, can be auto-graded, and turns passive reading into self-explanation.
- In insight-recall drills, ask the learner to type or think the key idea in one sentence *before* revealing it.

## 9. Chunking, schemas and code templates

**Evidence: Strong** (chunking and expertise). **Emerging** (template-based instruction for programming).

**What the research says.** Working memory holds only a few chunks, about four by modern estimates (Miller, 1956;
Cowan, 2001). Experts group information into larger meaningful chunks: chess masters recall real positions far
better than novices but lose that advantage on random positions (Chase & Simon, 1973; Gobet et al., 2001).
Programmers show the same pattern. Experts recall meaningful programs better, not scrambled ones (McKeithen et al.,
1981), and they reason with stereotyped "programming plans" that break down when code violates convention (Soloway &
Ehrlich, 1984). Xie et al. (2019) proposed teaching reusable **templates** explicitly and found it improved
novices' completion rates and reduced errors.

**Key sources.** Miller (1956); Cowan (2001); Chase & Simon (1973); Gobet et al. (2001); McKeithen et al. (1981);
Soloway & Ehrlich (1984); Xie et al. (2019).

**How IntPrep uses it.**
- **Pattern unit intros** give a reusable template (for example, the sliding-window expand/shrink loop) and the
  recognition cues that trigger it. Once learned, each pattern is a chunk that frees working memory for the new
  parts of a problem.
- **Chunked code walkthroughs** (4–9 chunks of 1–6 lines) present solutions in units that fit working memory.
- **Mnemonics** and **key lines** give each solution a small, memorable core to rebuild around.
- When showing a new problem, highlight what is *the same as the template* and what is *new*.

## 10. Deliberate practice

**Evidence: Moderate.** Practice clearly matters, but how much it explains is debated.

**What the research says.** Ericsson, Krampe and Tesch-Römer (1993) argued that expert performance comes from
*deliberate practice*: focused work on specific weaknesses, at the edge of current ability, with immediate
feedback. A later meta-analysis found deliberate practice explained 26% of performance differences in games, 21% in
music, 18% in sports, 4% in education and under 1% in professions (Macnamara, Hambrick & Oswald, 2014). So targeted
practice is important, but it is not the whole story. For IntPrep the useful lesson is about the *quality* of
practice: specific goals, feedback, and attention to weak spots.

**Key sources.** Ericsson, Krampe & Tesch-Römer (1993); Macnamara, Hambrick & Oswald (2014); Ericsson & Pool (2016).

**How IntPrep uses it.**
- Each drill type isolates one sub-skill (recognise, recall the insight, write the key line, analyse complexity,
  rebuild) and gives immediate feedback.
- The scheduler naturally brings weak problems back more often. The **daily drill should also weight weak
  patterns** (lowest recent accuracy) more heavily, and a "weak spots" view should show the learner where to focus.
- Do not promise that hours alone produce mastery; reward accurate, focused practice rather than volume.

## 11. Metacognition and calibrated confidence

**Evidence: Strong.**

**What the research says.** People are often poor judges of their own knowledge. When the answer is in front of you,
it feels easier to recall than it really is (Koriat & Bjork, 2005), and fluent but ineffective strategies like
massed practice *feel* more effective (Kornell & Bjork, 2008). Overconfident students stop studying too early and
retain less (Dunlosky & Rawson, 2012), and the least skilled tend to overestimate themselves most (Kruger & Dunning,
1999). Feedback helps: errors made with high confidence are especially likely to be corrected after feedback
(hypercorrection; Butterfield & Metcalfe, 2001), and feedback also secures correct answers given with low
confidence (Butler, Karpicke & Roediger, 2008).

**Key sources.** Koriat & Bjork (2005); Kornell & Bjork (2008); Dunlosky & Rawson (2012); Kruger & Dunning (1999);
Butterfield & Metcalfe (2001); Butler, Karpicke & Roediger (2008).

**How IntPrep uses it.**
- The scheduler grades reviews from **what the learner actually got right**, not only from self-ratings.
- Where self-rating is used (insight recall), ask for confidence *before* revealing the answer, then compare. Use
  objective drills (key-line fill-in, Parsons) to cross-check self-rated items. If a learner rates "Easy" but then
  fails an objective drill, shorten that problem's interval.
- End-of-session recaps should **highlight confident errors** ("You were sure, but this one was sliding window"),
  because those are the most correctable.
- A simple calibration stat (for example, "When you say you know it, you're right 82% of the time") teaches
  learners to trust the queue rather than their gut.

## 12. Feedback: what to show, and when

**Evidence: Strong** (that feedback matters). **Mixed** (on timing).

**What the research says.** Feedback is among the most powerful influences on learning. It works best when it is
about the task, the process or self-regulation, and worst when it is about the person (for example, generic praise)
(Hattie & Timperley, 2007; Shute, 2008). Multiple-choice tests can teach the wrong answer (a learner may remember a
plausible distractor), and feedback removes most of that risk (Butler & Roediger, 2008). Multiple-choice
questions with plausible, competitive distractors make learners think about the wrong options as well, which helped them
later answer related questions (Little et al., 2012).
On timing, classroom studies have usually found immediate feedback better, while lab studies often favour a delay
(Kulik & Kulik, 1988). Delayed feedback can help because it is effectively a second, spaced exposure (Butler,
Karpicke & Roediger, 2007).

**Key sources.** Hattie & Timperley (2007); Shute (2008); Butler & Roediger (2008); Little, Bjork, Bjork & Angello
(2012); Kulik & Kulik (1988); Butler, Karpicke & Roediger (2007); Metcalfe, Kornell & Finn (2009).

**How IntPrep uses it.**
- **Immediate feedback after every answer:** correct or not, plus a one-line *why* (the recognition cue, the key
  line, the reason for the complexity).
- **End-of-session recap:** list the misses with the correct answers again. This adds the benefit of delayed,
  spaced re-exposure without slowing the drill.
- Multiple-choice distractors should be **plausible neighbours** (similar patterns, off-by-one complexities),
  never joke options.
- Keep praise about the work ("You spotted the window shrink condition") rather than the person ("You're a genius").

## 13. Teaching absolute beginners to program

**Evidence: Emerging** (computing education).

**What the research says.** A multinational study found that many novices cannot reliably read and trace code, which
may explain why they struggle to write it (Lister et al., 2004). Xie et al. (2019) proposed teaching four skills in order: tracing, writing
syntax, understanding templates, and writing with templates. Doing so improved completion and reduced errors.
The PRIMM approach (Predict, Run, Investigate, Modify, Make) starts by having learners predict what code will do
(Sentance, Waite & Kallia, 2019). Teaching problem solving explicitly as a series of stages, and helping learners
monitor where they are, increased productivity, independence and self-efficacy in a camp study (Loksa et al.,
2016). This echoes Pólya's classic four steps: understand the problem, devise a plan, carry it out, look back
(Pólya, 1945).

**Key sources.** Lister et al. (2004); Xie et al. (2019); Sentance, Waite & Kallia (2019); Loksa et al. (2016);
Pólya (1945).

**How IntPrep uses it.**
- The **foundations track** should teach *reading and tracing* before *writing*: "What does this print?" and
  "What is `i` after the loop?" exercises come before "write a function that...".
- The **problem-solving framework** (understand, examples, brute force, optimise, code, test) is taught once in
  foundations and then shown as a slim progress bar in every guided lesson, so the learner always knows which stage
  they are in.
- Big-O and recursion lessons use worked examples and tracing tables before asking learners to analyse code alone.

---

# Part B: Motivation, fun and habit

## 14. Flow and the difficulty sweet spot

**Evidence: Moderate** (flow). **Emerging** (the specific 85% figure).

**What the research says.** Flow is the state of deep, enjoyable absorption that occurs when challenge and skill are
balanced, goals are clear and feedback is immediate (Csikszentmihalyi, 1990; Nakamura & Csikszentmihalyi, 2002).
Too easy leads to boredom; too hard leads to anxiety. A computational analysis found that, for a broad class of
learning algorithms, learning is fastest when training is answered correctly about 85% of the time (Wilson et al.,
2019). This is a useful rule of thumb for people, not a proven law.

**Key sources.** Csikszentmihalyi (1990); Nakamura & Csikszentmihalyi (2002); Wilson, Shenhav, Straccia & Cohen (2019).

**How IntPrep uses it.**
- A clear daily goal, short sessions, instant feedback and the combo meter provide the conditions for flow.
- **Target success rate:** aim for roughly 80–90% correct in reviews. That matches FSRS's 90% default and the
  85% heuristic. If a learner's review accuracy stays above about 95%, intervals can grow faster; if it falls
  below about 75%, intervals should shrink and fewer new problems should be introduced.
- Pattern Blitz should draw only from patterns the learner has studied, so a fast pace does not turn into guessing.

## 15. Self-determination theory

**Evidence: Strong.**

**What the research says.** Lasting, self-driven (intrinsic) motivation grows when three needs are met: **autonomy**
(feeling in control), **competence** (feeling effective and improving) and **relatedness** (feeling connected) (Ryan
& Deci, 2000). Video games are compelling largely because they satisfy these needs (Ryan, Rigby & Przybylski, 2006).
Expected, tangible rewards for doing a task tend to undermine intrinsic motivation for it, while positive,
informational feedback enhances it (Deci, Koestner & Ryan, 1999). Intrinsic motivation predicts the *quality* of
performance; incentives better predict *quantity* (Cerasoli, Nicklin & Ford, 2014).

**Key sources.** Ryan & Deci (2000); Ryan, Rigby & Przybylski (2006); Deci, Koestner & Ryan (1999); Cerasoli,
Nicklin & Ford (2014).

**How IntPrep uses it.**
- **Autonomy:** learners pick their daily XP goal, choose which unit to study, and can mute sounds, turn off
  confetti or hide the streak.
- **Competence:** mastery crowns, the weekly XP chart, the streak calendar and per-pattern accuracy show real
  progress. XP and achievements should be framed as *information about learning* ("12 problems now remembered
  for 3+ weeks") rather than as payment.
- **Relatedness:** IntPrep is a static site with no accounts, so social features are limited. A shareable progress
  card or "study buddy" link could add a light social element without leaderboards.

## 16. What the gamification research shows

**Evidence: Moderate.** Positive on average, but effects vary widely by design and context.

**What the research says.** Gamification means using game design elements in non-game contexts (Deterding et al.,
2011). An early review found mostly positive effects that depended heavily on context and on the users (Hamari,
Koivisto & Sarsa, 2014). A later review of 819 studies found results leaned positive but were remarkably mixed
(Koivisto & Hamari, 2019). In education, a meta-analysis found small positive effects on cognitive (g = 0.49),
motivational (g = 0.36) and behavioural (g = 0.25) outcomes; only the cognitive effect held up in the most rigorous
studies (Sailer & Homner, 2020). Another meta-analysis found g = 0.50 on academic performance (Bai, Hew & Huang,
2020). Individual elements have specific effects: badges, leaderboards and performance graphs raised feelings of
competence, while avatars, stories and teammates raised relatedness (Sailer et al., 2017). Leaderboards act much
like hard goals (Landers, Bauer & Callan, 2017). But they are also the element most often linked to negative effects
(Toda, Valle & Isotani, 2018; Almeida et al., 2023).

**Key sources.** Deterding et al. (2011); Hamari, Koivisto & Sarsa (2014); Koivisto & Hamari (2019); Sailer & Homner
(2020); Bai, Hew & Huang (2020); Sailer, Hense, Mayr & Mandl (2017); Landers, Bauer & Callan (2017); Toda, Valle &
Isotani (2018); Almeida et al. (2023); Hanus & Fox (2015).

**How IntPrep uses it.**
- Game elements wrap a learning core that already works (retrieval, spacing, interleaving). They do not replace it.
- XP, levels, achievements, crowns and charts are chosen for their **competence** effects.
- **No public leaderboards.** Use self-comparison instead: "this week vs. last week", personal bests in Pattern
  Blitz, and crowns earned.

## 17. What Duolingo has published about streaks, goals and leagues

**Evidence: Industry** (company-reported A/B tests and analyses; not peer-reviewed).

| Finding | Source |
|---|---|
| Separating the streak from the daily XP goal (one lesson extends the streak; goal tracked separately) raised Day-14 retention by 3.3%, daily active learners by 1%, and the share of new learners on a streak by 19%. Learners with the "intense" goal had been the *least* likely to be on a streak. | Yu (2020) |
| Learners with a 7-day streak were 2.4× more likely to return the next day. | Yu (2020) |
| Allowing learners to hold **two** Streak Freezes instead of one increased daily active learners by 0.38%. | Mansur (2022) |
| A new streak milestone animation raised the share of new learners still active after 7 days by 1.7%. | Mansur (2022) |
| Duolingo cites research on "slack" in goals as the reason for Streak Freezes. That is the emergency-reserve work in Section 18. | Mansur (2022) |
| **Weekend Amulet** (protects the streak over a weekend): learners were 4% more likely to return a week later and 5% less likely to lose their streak. | Loh (2017) |
| **Streak Wager** (bet in-app currency on keeping a 7-day streak): Day-7 retention up 14%. | Loh (2017) |
| Learners who binge lessons are much more likely to abandon the app than those who pace themselves. | Loh (2017) |
| Leaderboards (weekly leagues) increased overall learning time by 17% and tripled "highly engaged" learners. A "streak saver" reminder for learners about to lose a streak was an early big win. | Mazal (2023) |
| Leagues reset weekly, match learners with similar habits, and can be switched off. "Leaderboards aren't for everyone." | Duolingo (2023) |

**What to take from this.** Duolingo optimises for daily active users, and these numbers measure engagement, not
learning. Even so, several findings line up with the academic research and are worth copying: **decouple the
streak from the XP goal**, **allow a small, limited reserve of freezes**, **protect planned rest**, and
**encourage pacing over bingeing**. The leaderboard result shows competition boosts time-on-app, but the academic
evidence (Section 16 and Part C) shows it carries the most risk for learners, so IntPrep leaves it out.

## 18. Behavioural levers

**Evidence: Strong** (loss aversion, goal setting, implementation intentions). **Moderate** (the rest).

**What the research says.**
- **Goal gradient.** Effort increases as a goal gets closer. Café customers bought coffee more often as they neared
  a free one (Kivetz, Urminsky & Zheng, 2006), echoing Hull (1932).
- **Endowed progress.** A 10-stamp card with 2 stamps already filled in was completed more often and faster than an
  equivalent 8-stamp card (Nunes & Drèze, 2006).
- **Loss aversion.** Losses loom larger than equivalent gains (Kahneman & Tversky, 1979; Tversky & Kahneman, 1991).
  This is what makes a long streak motivating, and also what makes losing one painful.
- **Broken streaks.** People are more likely to continue a behaviour when it extends an intact streak; after a streak
  breaks, engagement drops (Silverman & Barasch, 2023). The authors suggest de-emphasising broken streaks or letting
  people repair them.
- **Emergency reserves (slack with a cost).** People prefer and persist longer with goals that include a few explicit
  "emergency" skips, especially when using one has a cost (Sharif & Shu, 2017). Reserves also help people keep going
  after a failure (Sharif & Shu, 2021).
- **Fresh starts.** Temporal landmarks (a new week, month or semester) prompt people to restart goals (Dai, Milkman &
  Riis, 2014).
- **Goal setting.** Specific, challenging goals with feedback outperform "do your best" (Locke & Latham, 2002).
- **Implementation intentions.** "If it is after breakfast, then I will do my reviews" plans have a medium-to-large
  effect on reaching goals (d = 0.65; Gollwitzer & Sheeran, 2006).
- **Flexibility beats rigidity.** Rewarding gym visits at *any* time built more lasting exercise than rewarding a
  fixed daily time slot (Beshears et al., 2021).

**How IntPrep uses it.**
- **Goal gradient:** the daily goal ring and "2 more reviews to hit today's goal" messages; crown progress bars.
- **Endowed progress:** count real completed work at the start of a unit (for example, the pattern intro is step 1)
  so progress bars never start at a discouraging zero. Never fake progress.
- **Loss aversion:** use lightly. A long streak is motivating, but do not threaten learners with loss.
- **Emergency reserves:** streak freezes bought with gems are exactly "slack with a cost". Keep the cap low (2).
- **Fresh starts:** reset the weekly XP chart on Monday, and after a lapse greet the learner with "New week, fresh
  start" rather than a big zero.
- **Implementation intentions:** during onboarding, ask "When will you practise?" (for example, "after my morning
  coffee") and offer a calendar file (`.ics`) for a daily reminder, which a static site can do.
- **Flexibility:** any time of day counts, and the streak never depends on hitting a large XP target.

## 19. Habit formation

**Evidence: Moderate.**

**What the research says.** Habits are behaviours triggered automatically by a context cue after many repetitions
(Wood & Rünger, 2016). In a 12-week study of a daily behaviour performed in a consistent context, the modelled time
to reach 95% of peak automaticity ranged from 18 to 254 days, with a median of about 66. **Missing one opportunity
did not materially affect habit formation** (Lally et al., 2010). Consistency matters, but a single slip does not.

**Key sources.** Lally, van Jaarsveld, Potts & Wardle (2010); Wood & Rünger (2016); Gollwitzer & Sheeran (2006).

**How IntPrep uses it.**
- The streak rewards *showing up* daily, with a low bar (see the gamification rules).
- Set honest expectations in onboarding: "Habits take around two months to feel automatic. Missing a day won't
  undo it."
- When a freeze is used or a streak breaks, say so: "One missed day doesn't erase a habit. Pick up where you left off."
- Encourage a consistent cue (time or routine) through the implementation-intention prompt (Section 18).

---

# Part C: Making it fun without hurting learning

## Risks and mitigations

| Risk | What the evidence says | Mitigation in IntPrep |
|---|---|---|
| **Overjustification: rewards crowd out interest** | Expected, tangible, task-contingent rewards reduced free-choice intrinsic motivation (Lepper, Greene & Nisbett, 1973; Deci, Koestner & Ryan, 1999). When incentives are tied directly to performance, intrinsic motivation matters less for performance (Cerasoli et al., 2014). | Frame XP and achievements as *information about progress*, not payment. Make some achievements unexpected. Keep "remembered for 3+ weeks" (crowns) as the headline metric, above XP. |
| **Gamified course reduced motivation and exam scores** | A semester-long class with leaderboards and badges led to lower intrinsic motivation, satisfaction and final exam scores than the same class without them (Hanus & Fox, 2015). | No leaderboards or public ranking. Social comparison is opt-in only. |
| **Leaderboards and competition** | Leaderboards were the element most often linked to negative effects, and loss of performance was the most common effect (Toda et al., 2018). Badges, leaderboards, competition and points were the elements most often reported as causing negative effects (Almeida et al., 2023). | Self-competition only: weekly XP vs. last week, Blitz personal best. |
| **Gaming the system and "gamification misuse"** | Some Duolingo users become so fixated on the game layer that it distracts them from learning, wasting time and harming learning. Competitiveness was a common cause (Hadi Mogavi et al., 2022). Gaming the system and cheating are frequently reported side effects (Almeida et al., 2023). | XP for **due** reviews and **new** learning. Re-drilling items that aren't due gives sharply reduced XP. Hints never cost XP but do lower the review grade, so there is no incentive to hide struggle. XP for a correct answer after an initial miss. |
| **Streak anxiety and broken-streak drop-off** | Losing a long streak is discouraging (Loh, 2017). Engagement falls after a streak breaks (Silverman & Barasch, 2023). One missed day does not harm habit formation (Lally et al., 2010). | Auto-applied freezes (max 2), an optional streak repair, a weekly rest-day option, "total days practised" and "longest streak" shown alongside the current streak, an option to hide the streak, and no guilt-tripping copy. |
| **Bingeing instead of spacing** | Bingers are more likely to quit (Loh, 2017). Massed practice feels effective but retains less (Kornell & Bjork, 2008; Cepeda et al., 2006). | A clear "done for today" state once due reviews and the daily goal are finished. Cap new problems per day. Reduced XP for extra non-due drilling. |
| **Fluency illusions from easy formats** | Recognition formats feel easy and give smaller benefits than recall (Rowland, 2014). Learners misread effort as poor learning (Kirk-Johnson et al., 2019). | A format ladder that moves to recall as items mature. Top crowns require a recall drill. In-app explanations of why harder practice works. |
| **Distracting "juice" and seductive details** | Interesting but irrelevant additions reduce learning (Harp & Mayer, 1998; Rey, 2012). Visual embellishments improve appeal but affect felt competence only in some circumstances (Hicks et al., 2019). | Celebrate at **boundaries** (correct answer, session end, goal met, crown earned), never during reading or the walkthrough. Respect `prefers-reduced-motion`, offer a single sound toggle, and keep haptics short and optional. |
| **Time pressure for novices** | Flow needs challenge matched to skill (Nakamura & Csikszentmihalyi, 2002). Speed before accuracy pushes guessing. | Pattern Blitz unlocks after 3 patterns, uses only studied patterns, and has an untimed practice mode. Combos reward streaks of correct answers; only Blitz rewards speed. Blitz misses go into the review queue. |
| **Manipulative "dark pattern" design** | Chou (2015) separates "White Hat" drives (meaning, accomplishment, empowerment) from "Black Hat" drives (scarcity, unpredictability, loss), which create urgency but burn out users. Eyal (2014) proposes asking whether a habit-forming product materially improves users' lives. | Lead with White Hat drives: crowns, progress and skill. Use loss (streaks) gently and always with forgiveness. No artificial scarcity, no gems for sale, no random reward boxes. |

## IntPrep's gamification rules

These rules turn the research above into specific design decisions. They are recommendations where the feature is
not yet built.

**Streak**
1. A day counts when the learner completes **one meaningful session**: either all due reviews (if any) or one
   guided lesson or one daily drill set. The streak is **not tied to the daily XP goal** (Yu, 2020).
2. **Streak freezes** are auto-applied on a missed day. Hold at most **2** (Mansur, 2022; Sharif & Shu, 2017). They
   cost gems that a learner earns in about two days of normal practice, so they are slack with a modest cost, not
   a paywall. New learners start with one free freeze.
3. **Streak repair (recommended):** if a streak breaks with no freeze available, offer a 48-hour window to restore it
   by completing a slightly longer "repair session" (Silverman & Barasch, 2023; Lally et al., 2010).
4. **Optional weekly rest day:** a learner can choose one day a week that never breaks the streak (Weekend Amulet
   result in Loh, 2017; flexibility result in Beshears et al., 2021).
5. Display current streak, longest streak and total days practised. After a break, show "fresh start" messaging,
   not a large "0" (Dai et al., 2014).
6. Use the user's local midnight for day boundaries and say clearly when the day ends.

**Daily XP goal**
1. Offer 4 levels (for example 10, 20, 30, 50 XP). Default to a modest one and let learners change it any time.
   The "intense" goal correlated with *losing* streaks at Duolingo (Yu, 2020).
2. When the goal and due reviews are done, show a clear **"You're done for today"** screen. "Keep going" stays
   available but is not the default.

**XP**
1. Award XP for due reviews, new lessons and first-time correct answers. Give a small bonus for recovering a missed
   item later in the same session.
2. Give no XP penalty for wrong predictions or for using hints. Hints affect only the review grade.
3. Give sharply reduced XP for reviewing problems that are not due (protects spacing and prevents XP farming).

**Levels, achievements, crowns**
1. Levels come from XP and act as a light progress signal.
2. **Crowns are the headline mastery signal.** Derive them from the review interval (for example 1 crown at 7 days,
   2 at 21 days, 3 at 60 days), and require a successful recall drill (key-line fill-in or rebuild) for the top crown.
3. When a crowned problem becomes overdue, show it as "fading" rather than removing the crown. This is an honest
   cue to review, not a punishment.
4. Achievements should mostly reward **learning behaviours**: "Predicted the pattern before reading 25 times",
   "Recovered 10 forgotten problems", "Calibrated: your confidence matched your accuracy this week", "First full
   rebuild from memory". Some should be surprises.

**Combo meter, Pattern Blitz, celebrations**
1. In normal drills, the combo meter counts consecutive correct answers but never rewards speed.
2. Pattern Blitz: 60 seconds, combo multiplier, a personal best, and an untimed mode. It unlocks after 3 patterns,
   draws only from studied patterns, and sends misses to the review queue. Show an end-of-round recap with the
   recognition cue for each miss.
3. Confetti and sounds are for session end, goal met, crown earned and milestones. Use a small tick or shimmer for
   single correct answers. Nothing animates during reading.

**Session size**
1. Aim for a **10–15 minute** daily session. Introduce at most **1–3 new problems per day** for beginners (more
   when review accuracy is high), and cap a day's reviews at around **20–30 problems**, spreading any backlog over
   several days.
2. Order a session as due reviews first (the most fragile memories), then the interleaved drill, then new material.

## IntPrep's review-scheduling rules

**Auto-grading.** Each review of a problem is graded from performance:

| Grade | Rule (any drill type) |
|---|---|
| **Again** | Wrong answer, revealed the solution, or gave up. |
| **Hard** | Correct but used a hint, needed a second attempt, or reported low confidence. (Hard is a pass, as in Anki.) |
| **Good** | Correct, unaided, on the first attempt. |
| **Easy** | Correct, unaided, first attempt, high confidence, and well under the typical time. For rebuild drills, all key lines correct. |

**Scheduling.**
- Start with SM-2: intervals of 1 day, then 6 days, then interval × EF (EF starts at 2.5, minimum 1.3). Hard grows the
  interval a little, Easy a lot.
- **Again:** the problem comes back later in the same session until answered correctly, then returns tomorrow
  (successive relearning; SM-2 step 7).
- **Format ladder:** choose the drill type from the current interval, for example under 7 days: recognition or
  Parsons; 7–21 days: key-line fill-in or insight recall; over 21 days: rebuild from memory (with key-line fill-in
  as a fallback on mobile).
- **Self-rating cross-check:** if a self-rated "Easy" is followed by a failed objective drill on the same problem,
  treat the review as Again.
- **Retention target:** monitor the learner's review accuracy. Aim for 85–90%. Lengthen intervals if accuracy stays
  above about 95%, and shorten them and slow new material if it drops below about 75%.
- **Optional interview date:** if a learner sets one, cap intervals so every studied problem gets at least one review
  in the final week, and keep gaps at roughly 10–20% of the time remaining (a rough reading of Cepeda et al., 2008).

---

# Part D: Books, and what we take from each

| Book | Core idea | What IntPrep takes from it |
|---|---|---|
| **Make It Stick** (Brown, Roediger & McDaniel, 2014) | Retrieval, spacing, interleaving, generation, reflection and calibration; learning that feels easy is often shallow. | The drill set, the review queue, and the UI copy that explains why effortful practice works. |
| **A Mind for Numbers** (Oakley, 2014) and **Learning How to Learn** (Oakley, Sejnowski & McConville, 2018) | Focused and diffuse thinking, chunking, illusions of competence, short focused sessions. | Short daily sessions, chunked walkthroughs, recall over rereading, encouragement to step away when stuck. |
| **Peak** (Ericsson & Pool, 2016) | Purposeful practice with clear goals, feedback and stretch; experts build rich mental representations. | Sub-skill drills, weak-spot targeting, patterns as mental representations. |
| **Atomic Habits** (Clear, 2018) | Make it obvious, attractive, easy and satisfying; habit tracking; "never miss twice". | A low daily bar, a visible streak calendar, an implementation-intention prompt, and freezes and repair that support "never miss twice". |
| **Hooked** (Eyal, 2014) | Trigger, action, variable reward, investment; ethics check through the "Manipulation Matrix". | Daily trigger (reminder), small easy action (one session), investment (crowns that grow), and the ethics check: the habit must genuinely help. |
| **Actionable Gamification** (Chou, 2015) | The Octalysis framework of 8 core drives; White Hat vs. Black Hat motivation. | Lead with accomplishment, empowerment and meaning; use loss and scarcity sparingly. |
| **The Gamification of Learning and Instruction** (Kapp, 2012) | Applying game mechanics and thinking (goals, feedback, challenge, story) to instruction. | Clear goals and feedback loops; challenge that rises with skill. |
| **Why Don't Students Like School?** (Willingham, 2009) | People enjoy solvable problems; memory is the residue of thought; practice is essential; novices think differently from experts. | Problems pitched just within reach, every activity built so learners think about the *meaning* (why a pattern fits), and worked examples for novices. |
| **Flow** (Csikszentmihalyi, 1990) | Optimal experience comes from balanced challenge, clear goals and immediate feedback. | Session design, target success rate, combo meter, Blitz pacing. |
| **The Programmer's Brain** (Hermans, 2021) | Cognitive science applied to reading and writing code: chunking, working-memory load, flashcards for syntax and concepts. | Chunked walkthroughs, templates, spaced recall of code. |
| **Tiny Habits** (Fogg, 2019) | Start tiny, anchor to an existing routine, celebrate immediately. | A low streak bar, implementation-intention onboarding, and a small celebration on finishing. |
| **How to Solve It** (Pólya, 1945) | Understand, plan, carry out, look back. | The problem-solving framework in the foundations track and lesson progress bar. |

---

# References

All DOIs and bibliographic details were checked against Crossref or the publisher record.

## Peer-reviewed and academic sources

- Adesope, O. O., Trevisan, D. A., & Sundararajan, N. (2017). Rethinking the use of tests: A meta-analysis of practice testing. *Review of Educational Research, 87*(3), 659–701. https://doi.org/10.3102/0034654316689306
- Almeida, C., Kalinowski, M., Uchôa, A., & Feijó, B. (2023). Negative effects of gamification in education software: Systematic mapping and practitioner perceptions. *Information and Software Technology, 156*, 107142. https://doi.org/10.1016/j.infsof.2022.107142
- Atkinson, R. K., Derry, S. J., Renkl, A., & Wortham, D. (2000). Learning from examples: Instructional principles from the worked examples research. *Review of Educational Research, 70*(2), 181–214. https://doi.org/10.3102/00346543070002181
- Bai, S., Hew, K. F., & Huang, B. (2020). Does gamification improve student learning outcome? Evidence from a meta-analysis and synthesis of qualitative data in educational contexts. *Educational Research Review, 30*, 100322. https://doi.org/10.1016/j.edurev.2020.100322
- Bertsch, S., Pesta, B. J., Wiscott, R., & McDaniel, M. A. (2007). The generation effect: A meta-analytic review. *Memory & Cognition, 35*(2), 201–210. https://doi.org/10.3758/BF03193441
- Beshears, J., Lee, H. N., Milkman, K. L., Mislavsky, R., & Wisdom, J. (2021). Creating exercise habits using incentives: The trade-off between flexibility and routinization. *Management Science, 67*(7), 4139–4171. https://doi.org/10.1287/mnsc.2020.3706
- Bisra, K., Liu, Q., Nesbit, J. C., Salimi, F., & Winne, P. H. (2018). Inducing self-explanation: A meta-analysis. *Educational Psychology Review, 30*(3), 703–725. https://doi.org/10.1007/s10648-018-9434-x
- Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning. In M. A. Gernsbacher, R. W. Pew, L. M. Hough, & J. R. Pomerantz (Eds.), *Psychology and the real world: Essays illustrating fundamental contributions to society* (pp. 56–64). Worth Publishers. https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf
- Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. P. Shimamura (Eds.), *Metacognition: Knowing about knowing* (pp. 185–205). MIT Press. https://doi.org/10.7551/mitpress/4561.003.0011
- Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin, 145*(11), 1029–1052. https://doi.org/10.1037/bul0000209
- Butler, A. C., Karpicke, J. D., & Roediger, H. L., III. (2007). The effect of type and timing of feedback on learning from multiple-choice tests. *Journal of Experimental Psychology: Applied, 13*(4), 273–281. https://doi.org/10.1037/1076-898X.13.4.273
- Butler, A. C., Karpicke, J. D., & Roediger, H. L., III. (2008). Correcting a metacognitive error: Feedback increases retention of low-confidence correct responses. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 34*(4), 918–928. https://doi.org/10.1037/0278-7393.34.4.918
- Butler, A. C., & Roediger, H. L., III. (2008). Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing. *Memory & Cognition, 36*(3), 604–616. https://doi.org/10.3758/MC.36.3.604
- Butterfield, B., & Metcalfe, J. (2001). Errors committed with high confidence are hypercorrected. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 27*(6), 1491–1494. https://doi.org/10.1037/0278-7393.27.6.1491
- Carpenter, S. K., Pan, S. C., & Butler, A. C. (2022). The science of effective learning with spacing and retrieval practice. *Nature Reviews Psychology, 1*(9), 496–511. https://doi.org/10.1038/s44159-022-00089-1
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354–380. https://doi.org/10.1037/0033-2909.132.3.354
- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science, 19*(11), 1095–1102. https://doi.org/10.1111/j.1467-9280.2008.02209.x
- Cerasoli, C. P., Nicklin, J. M., & Ford, M. T. (2014). Intrinsic motivation and extrinsic incentives jointly predict performance: A 40-year meta-analysis. *Psychological Bulletin, 140*(4), 980–1008. https://doi.org/10.1037/a0035661
- Chase, W. G., & Simon, H. A. (1973). Perception in chess. *Cognitive Psychology, 4*(1), 55–81. https://doi.org/10.1016/0010-0285(73)90004-2
- Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989). Self-explanations: How students study and use examples in learning to solve problems. *Cognitive Science, 13*(2), 145–182. https://doi.org/10.1207/s15516709cog1302_1
- Chi, M. T. H., De Leeuw, N., Chiu, M.-H., & LaVancher, C. (1994). Eliciting self-explanations improves understanding. *Cognitive Science, 18*(3), 439–477. https://doi.org/10.1207/s15516709cog1803_3
- Cowan, N. (2001). The magical number 4 in short-term memory: A reconsideration of mental storage capacity. *Behavioral and Brain Sciences, 24*(1), 87–114. https://doi.org/10.1017/S0140525X01003922
- Dai, H., Milkman, K. L., & Riis, J. (2014). The fresh start effect: Temporal landmarks motivate aspirational behavior. *Management Science, 60*(10), 2563–2582. https://doi.org/10.1287/mnsc.2014.1901
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin, 125*(6), 627–668. https://doi.org/10.1037/0033-2909.125.6.627
- Denny, P., Luxton-Reilly, A., & Simon, B. (2008). Evaluating a new exam question: Parsons problems. In *Proceedings of the Fourth International Workshop on Computing Education Research (ICER '08)* (pp. 113–124). ACM. https://doi.org/10.1145/1404520.1404532
- Deterding, S., Dixon, D., Khaled, R., & Nacke, L. (2011). From game design elements to gamefulness: Defining "gamification". In *Proceedings of the 15th International Academic MindTrek Conference* (pp. 9–15). ACM. https://doi.org/10.1145/2181037.2181040
- Dunlosky, J., & Rawson, K. A. (2012). Overconfidence produces underachievement: Inaccurate self evaluations undermine students' learning and retention. *Learning and Instruction, 22*(4), 271–280. https://doi.org/10.1016/j.learninstruc.2011.08.003
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques: Promising directions from cognitive and educational psychology. *Psychological Science in the Public Interest, 14*(1), 4–58. https://doi.org/10.1177/1529100612453266
- Ericson, B. J., Denny, P., Prather, J., Duran, R., Hellas, A., Leinonen, J., Miller, C. S., Morrison, B. B., Pearce, J. L., & Rodger, S. H. (2022). Parsons problems and beyond: Systematic literature review and empirical study designs. In *Proceedings of the 2022 Working Group Reports on Innovation and Technology in Computer Science Education (ITiCSE-WGR '22)* (pp. 191–234). ACM. https://doi.org/10.1145/3571785.3574127
- Ericson, B. J., Foley, J. D., & Rick, J. (2018). Evaluating the efficiency and effectiveness of adaptive Parsons problems. In *Proceedings of the 2018 ACM Conference on International Computing Education Research (ICER '18)* (pp. 60–68). ACM. https://doi.org/10.1145/3230977.3231000
- Ericson, B. J., Margulieux, L. E., & Rick, J. (2017). Solving Parsons problems versus fixing and writing code. In *Proceedings of the 17th Koli Calling International Conference on Computing Education Research* (pp. 20–29). ACM. https://doi.org/10.1145/3141880.3141895
- Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. *Psychological Review, 100*(3), 363–406. https://doi.org/10.1037/0033-295X.100.3.363
- Gobet, F., Lane, P. C. R., Croker, S., Cheng, P. C.-H., Jones, G., Oliver, I., & Pine, J. M. (2001). Chunking mechanisms in human learning. *Trends in Cognitive Sciences, 5*(6), 236–243. https://doi.org/10.1016/S1364-6613(00)01662-4
- Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology, 38*, 69–119. https://doi.org/10.1016/S0065-2601(06)38002-1
- Hadi Mogavi, R., Guo, B., Zhang, Y., Haq, E.-U., Hui, P., & Ma, X. (2022). When gamification spoils your learning: A qualitative case study of gamification misuse in a language-learning app. In *Proceedings of the Ninth ACM Conference on Learning @ Scale (L@S '22)* (pp. 175–188). ACM. https://doi.org/10.1145/3491140.3528274
- Hamari, J., Koivisto, J., & Sarsa, H. (2014). Does gamification work? A literature review of empirical studies on gamification. In *Proceedings of the 47th Hawaii International Conference on System Sciences* (pp. 3025–3034). IEEE. https://doi.org/10.1109/HICSS.2014.377
- Hanus, M. D., & Fox, J. (2015). Assessing the effects of gamification in the classroom: A longitudinal study on intrinsic motivation, social comparison, satisfaction, effort, and academic performance. *Computers & Education, 80*, 152–161. https://doi.org/10.1016/j.compedu.2014.08.019
- Harp, S. F., & Mayer, R. E. (1998). How seductive details do their damage: A theory of cognitive interest in science learning. *Journal of Educational Psychology, 90*(3), 414–434. https://doi.org/10.1037/0022-0663.90.3.414
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research, 77*(1), 81–112. https://doi.org/10.3102/003465430298487
- Hicks, K., Gerling, K., Dickinson, P., & Vanden Abeele, V. (2019). Juicy game design: Understanding the impact of visual embellishments on player experience. In *Proceedings of the Annual Symposium on Computer-Human Interaction in Play (CHI PLAY '19)* (pp. 185–197). ACM. https://doi.org/10.1145/3311350.3347171
- Hull, C. L. (1932). The goal-gradient hypothesis and maze learning. *Psychological Review, 39*(1), 25–43. https://doi.org/10.1037/h0072640
- Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. *Econometrica, 47*(2), 263–291. https://doi.org/10.2307/1914185
- Kalyuga, S., Ayres, P., Chandler, P., & Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist, 38*(1), 23–31. https://doi.org/10.1207/S15326985EP3801_4
- Kang, S. H. K. (2016). Spaced repetition promotes efficient and effective learning: Policy implications for instruction. *Policy Insights from the Behavioral and Brain Sciences, 3*(1), 12–19. https://doi.org/10.1177/2372732215624708
- Kang, S. H. K., McDermott, K. B., & Roediger, H. L., III. (2007). Test format and corrective feedback modify the effect of testing on long-term retention. *European Journal of Cognitive Psychology, 19*(4–5), 528–558. https://doi.org/10.1080/09541440601056620
- Kapur, M. (2008). Productive failure. *Cognition and Instruction, 26*(3), 379–424. https://doi.org/10.1080/07370000802212669
- Kapur, M. (2016). Examining productive failure, productive success, unproductive failure, and unproductive success in learning. *Educational Psychologist, 51*(2), 289–299. https://doi.org/10.1080/00461520.2016.1155457
- Karpicke, J. D., & Blunt, J. R. (2011). Retrieval practice produces more learning than elaborative studying with concept mapping. *Science, 331*(6018), 772–775. https://doi.org/10.1126/science.1199327
- Karpicke, J. D., & Roediger, H. L., III. (2008). The critical importance of retrieval for learning. *Science, 319*(5865), 966–968. https://doi.org/10.1126/science.1152408
- Kirk-Johnson, A., Galla, B. M., & Fraundorf, S. H. (2019). Perceiving effort as poor learning: The misinterpreted-effort hypothesis of how experienced effort and perceived learning relate to study strategy choice. *Cognitive Psychology, 115*, 101237. https://doi.org/10.1016/j.cogpsych.2019.101237
- Kirschner, P. A., Sweller, J., & Clark, R. E. (2006). Why minimal guidance during instruction does not work: An analysis of the failure of constructivist, discovery, problem-based, experiential, and inquiry-based teaching. *Educational Psychologist, 41*(2), 75–86. https://doi.org/10.1207/s15326985ep4102_1
- Kivetz, R., Urminsky, O., & Zheng, Y. (2006). The goal-gradient hypothesis resurrected: Purchase acceleration, illusionary goal progress, and customer retention. *Journal of Marketing Research, 43*(1), 39–58. https://doi.org/10.1509/jmkr.43.1.39
- Koivisto, J., & Hamari, J. (2019). The rise of motivational information systems: A review of gamification research. *International Journal of Information Management, 45*, 191–210. https://doi.org/10.1016/j.ijinfomgt.2018.10.013
- Koriat, A., & Bjork, R. A. (2005). Illusions of competence in monitoring one's knowledge during study. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 31*(2), 187–194. https://doi.org/10.1037/0278-7393.31.2.187
- Kornell, N., & Bjork, R. A. (2008). Learning concepts and categories: Is spacing the "enemy of induction"? *Psychological Science, 19*(6), 585–592. https://doi.org/10.1111/j.1467-9280.2008.02127.x
- Kornell, N., Hays, M. J., & Bjork, R. A. (2009). Unsuccessful retrieval attempts enhance subsequent learning. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 35*(4), 989–998. https://doi.org/10.1037/a0015729
- Kruger, J., & Dunning, D. (1999). Unskilled and unaware of it: How difficulties in recognizing one's own incompetence lead to inflated self-assessments. *Journal of Personality and Social Psychology, 77*(6), 1121–1134. https://doi.org/10.1037/0022-3514.77.6.1121
- Kulik, J. A., & Kulik, C.-L. C. (1988). Timing of feedback and verbal learning. *Review of Educational Research, 58*(1), 79–97. https://doi.org/10.3102/00346543058001079
- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. *European Journal of Social Psychology, 40*(6), 998–1009. https://doi.org/10.1002/ejsp.674
- Landers, R. N., Bauer, K. N., & Callan, R. C. (2017). Gamification of task performance with leaderboards: A goal setting experiment. *Computers in Human Behavior, 71*, 508–515. https://doi.org/10.1016/j.chb.2015.08.008
- Latimier, A., Peyre, H., & Ramus, F. (2021). A meta-analytic review of the benefit of spacing out retrieval practice episodes on retention. *Educational Psychology Review, 33*(3), 959–987. https://doi.org/10.1007/s10648-020-09572-8
- Lepper, M. R., Greene, D., & Nisbett, R. E. (1973). Undermining children's intrinsic interest with extrinsic reward: A test of the "overjustification" hypothesis. *Journal of Personality and Social Psychology, 28*(1), 129–137. https://doi.org/10.1037/h0035519
- Lister, R., Adams, E. S., Fitzgerald, S., Fone, W., Hamer, J., Lindholm, M., McCartney, R., Moström, J. E., Sanders, K., Seppälä, O., Simon, B., & Thomas, L. (2004). A multi-national study of reading and tracing skills in novice programmers. In *Working Group Reports from ITiCSE on Innovation and Technology in Computer Science Education* (pp. 119–150). ACM. https://doi.org/10.1145/1044550.1041673
- Little, J. L., Bjork, E. L., Bjork, R. A., & Angello, G. (2012). Multiple-choice tests exonerated, at least of some charges: Fostering test-induced learning and avoiding test-induced forgetting. *Psychological Science, 23*(11), 1337–1344. https://doi.org/10.1177/0956797612443370
- Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation: A 35-year odyssey. *American Psychologist, 57*(9), 705–717. https://doi.org/10.1037/0003-066X.57.9.705
- Loksa, D., Ko, A. J., Jernigan, W., Oleson, A., Mendez, C. J., & Burnett, M. M. (2016). Programming, problem solving, and self-awareness: Effects of explicit guidance. In *Proceedings of the 2016 CHI Conference on Human Factors in Computing Systems* (pp. 1449–1461). ACM. https://doi.org/10.1145/2858036.2858252
- Macnamara, B. N., Hambrick, D. Z., & Oswald, F. L. (2014). Deliberate practice and performance in music, games, sports, education, and professions: A meta-analysis. *Psychological Science, 25*(8), 1608–1618. https://doi.org/10.1177/0956797614535810
- McKeithen, K. B., Reitman, J. S., Rueter, H. H., & Hirtle, S. C. (1981). Knowledge organization and skill differences in computer programmers. *Cognitive Psychology, 13*(3), 307–325. https://doi.org/10.1016/0010-0285(81)90012-8
- Metcalfe, J., Kornell, N., & Finn, B. (2009). Delayed versus immediate feedback in children's and adults' vocabulary learning. *Memory & Cognition, 37*(8), 1077–1087. https://doi.org/10.3758/MC.37.8.1077
- Miller, G. A. (1956). The magical number seven, plus or minus two: Some limits on our capacity for processing information. *Psychological Review, 63*(2), 81–97. https://doi.org/10.1037/h0043158
- Morrison, B. B., Margulieux, L. E., & Guzdial, M. (2015). Subgoals, context, and worked examples in learning computing problem solving. In *Proceedings of the Eleventh Annual International Conference on International Computing Education Research (ICER '15)* (pp. 21–29). ACM. https://doi.org/10.1145/2787622.2787733
- Nakamura, J., & Csikszentmihalyi, M. (2002). The concept of flow. In C. R. Snyder & S. J. Lopez (Eds.), *Handbook of positive psychology* (pp. 89–105). Oxford University Press. https://doi.org/10.1093/oso/9780195135336.003.0007
- Nunes, J. C., & Drèze, X. (2006). The endowed progress effect: How artificial advancement increases effort. *Journal of Consumer Research, 32*(4), 504–512. https://doi.org/10.1086/500480
- Pan, S. C., & Rickard, T. C. (2018). Transfer of test-enhanced learning: Meta-analytic review and synthesis. *Psychological Bulletin, 144*(7), 710–756. https://doi.org/10.1037/bul0000151
- Parsons, D., & Haden, P. (2006). Parson's programming puzzles: A fun and effective learning tool for first programming courses. In *Proceedings of the Eighth Australasian Computing Education Conference (ACE 2006)*, CRPIT Vol. 52 (pp. 157–163). Australian Computer Society. https://crpit.scem.westernsydney.edu.au/abstracts/CRPITV52Parsons.html
- Rawson, K. A., Dunlosky, J., & Sciartelli, S. M. (2013). The power of successive relearning: Improving performance on course exams and long-term retention. *Educational Psychology Review, 25*(4), 523–548. https://doi.org/10.1007/s10648-013-9240-4
- Renkl, A., & Atkinson, R. K. (2003). Structuring the transition from example study to problem solving in cognitive skill acquisition: A cognitive load perspective. *Educational Psychologist, 38*(1), 15–22. https://doi.org/10.1207/S15326985EP3801_3
- Rey, G. D. (2012). A review of research and a meta-analysis of the seductive detail effect. *Educational Research Review, 7*(3), 216–237. https://doi.org/10.1016/j.edurev.2012.05.003
- Richland, L. E., Kornell, N., & Kao, L. S. (2009). The pretesting effect: Do unsuccessful retrieval attempts enhance learning? *Journal of Experimental Psychology: Applied, 15*(3), 243–257. https://doi.org/10.1037/a0016496
- Roediger, H. L., III, & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x
- Rohrer, D. (2012). Interleaving helps students distinguish among similar concepts. *Educational Psychology Review, 24*(3), 355–367. https://doi.org/10.1007/s10648-012-9201-3
- Rohrer, D., Dedrick, R. F., & Stershic, S. (2015). Interleaved practice improves mathematics learning. *Journal of Educational Psychology, 107*(3), 900–908. https://doi.org/10.1037/edu0000001
- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science, 35*(6), 481–498. https://doi.org/10.1007/s11251-007-9015-8
- Rowland, C. A. (2014). The effect of testing versus restudy on retention: A meta-analytic review of the testing effect. *Psychological Bulletin, 140*(6), 1432–1463. https://doi.org/10.1037/a0037559
- Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*(1), 68–78. https://doi.org/10.1037/0003-066X.55.1.68
- Ryan, R. M., Rigby, C. S., & Przybylski, A. (2006). The motivational pull of video games: A self-determination theory approach. *Motivation and Emotion, 30*(4), 344–360. https://doi.org/10.1007/s11031-006-9051-8
- Sailer, M., Hense, J. U., Mayr, S. K., & Mandl, H. (2017). How gamification motivates: An experimental study of the effects of specific game design elements on psychological need satisfaction. *Computers in Human Behavior, 69*, 371–380. https://doi.org/10.1016/j.chb.2016.12.033
- Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*(1), 77–112. https://doi.org/10.1007/s10648-019-09498-w
- Sentance, S., Waite, J., & Kallia, M. (2019). Teaching computer programming with PRIMM: A sociocultural perspective. *Computer Science Education, 29*(2–3), 136–176. https://doi.org/10.1080/08993408.2019.1608781
- Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. In *Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)* (pp. 1848–1858). ACL. https://doi.org/10.18653/v1/P16-1174
- Sharif, M. A., & Shu, S. B. (2017). The benefits of emergency reserves: Greater preference and persistence for goals that have slack with a cost. *Journal of Marketing Research, 54*(3), 495–509. https://doi.org/10.1509/jmr.15.0231
- Sharif, M. A., & Shu, S. B. (2021). Nudging persistence after failure through emergency reserves. *Organizational Behavior and Human Decision Processes, 163*, 17–29. https://doi.org/10.1016/j.obhdp.2019.01.004
- Shute, V. J. (2008). Focus on formative feedback. *Review of Educational Research, 78*(1), 153–189. https://doi.org/10.3102/0034654307313795
- Silverman, J., & Barasch, A. (2023). On or off track: How (broken) streaks affect consumer decisions. *Journal of Consumer Research, 49*(6), 1095–1117. https://doi.org/10.1093/jcr/ucac029
- Sinha, T., & Kapur, M. (2021). When problem solving followed by instruction works: Evidence for productive failure. *Review of Educational Research, 91*(5), 761–798. https://doi.org/10.3102/00346543211019105
- Slamecka, N. J., & Graf, P. (1978). The generation effect: Delineation of a phenomenon. *Journal of Experimental Psychology: Human Learning and Memory, 4*(6), 592–604. https://doi.org/10.1037/0278-7393.4.6.592
- Soderstrom, N. C., & Bjork, R. A. (2015). Learning versus performance: An integrative review. *Perspectives on Psychological Science, 10*(2), 176–199. https://doi.org/10.1177/1745691615569000
- Soloway, E., & Ehrlich, K. (1984). Empirical studies of programming knowledge. *IEEE Transactions on Software Engineering, SE-10*(5), 595–609. https://doi.org/10.1109/TSE.1984.5010283
- Su, J., Ye, J., Nie, L., Cao, Y., & Chen, Y. (2023). Optimizing spaced repetition schedule by capturing the dynamics of memory. *IEEE Transactions on Knowledge and Data Engineering, 35*(10), 10085–10097. https://doi.org/10.1109/TKDE.2023.3251721
- Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. *Cognitive Science, 12*(2), 257–285. https://doi.org/10.1207/s15516709cog1202_4
- Sweller, J., & Cooper, G. A. (1985). The use of worked examples as a substitute for problem solving in learning algebra. *Cognition and Instruction, 2*(1), 59–89. https://doi.org/10.1207/s1532690xci0201_3
- Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. *Educational Psychology Review, 31*(2), 261–292. https://doi.org/10.1007/s10648-019-09465-5
- Toda, A. M., Valle, P. H. D., & Isotani, S. (2018). The dark side of gamification: An overview of negative effects of gamification in education. In *Higher Education for All. From Challenges to Novel Technology-Enabled Solutions* (Communications in Computer and Information Science, Vol. 832, pp. 143–156). Springer. https://doi.org/10.1007/978-3-319-97934-2_9
- Tversky, A., & Kahneman, D. (1991). Loss aversion in riskless choice: A reference-dependent model. *The Quarterly Journal of Economics, 106*(4), 1039–1061. https://doi.org/10.2307/2937956
- Wilson, R. C., Shenhav, A., Straccia, M., & Cohen, J. D. (2019). The eighty five percent rule for optimal learning. *Nature Communications, 10*, 4646. https://doi.org/10.1038/s41467-019-12552-4
- Wood, W., & Rünger, D. (2016). Psychology of habit. *Annual Review of Psychology, 67*, 289–314. https://doi.org/10.1146/annurev-psych-122414-033417
- Xie, B., Loksa, D., Nelson, G. L., Davidson, M. J., Dong, D., Kwik, H., Tan, A. H., Hwa, L., Li, M., & Ko, A. J. (2019). A theory of instruction for introductory programming skills. *Computer Science Education, 29*(2–3), 205–253. https://doi.org/10.1080/08993408.2019.1565235
- Ye, J., Su, J., & Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. In *Proceedings of the 28th ACM SIGKDD Conference on Knowledge Discovery and Data Mining (KDD '22)* (pp. 4381–4390). ACM. https://doi.org/10.1145/3534678.3539081

## Spaced-repetition algorithms and tools

- Anki Manual. *Deck options* (sections on FSRS and the Again/Hard/Good/Easy buttons). https://docs.ankiweb.net/deck-options.html
- Leitner, S. (1972). *So lernt man lernen*. Herder (Freiburg im Breisgau).
- open-spaced-repetition. *ts-fsrs: TypeScript implementation of FSRS*. https://open-spaced-repetition.github.io/ts-fsrs/
- Wozniak, P. A. (1990). *Optimization of learning* [Master's thesis, University of Technology in Poznań]. SM-2 description published as "Application of a computer to improve the results obtained in working with the SuperMemo method". https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method

## Industry sources (company-reported, not peer-reviewed)

- Duolingo. (2023, May 3). *How do Duolingo Leaderboards work?* Duolingo Blog. https://blog.duolingo.com/duolingo-leagues-leaderboards/
- Loh, K. H. (2017, May 10). *How Streaks keep Duolingo learners committed to their language goals*. Duolingo Blog. https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals
- Mansur, O. (2022, January 31). *The habit-building research behind your Duolingo streak*. Duolingo Blog. https://blog.duolingo.com/how-duolingo-streak-builds-habit
- Mazal, J. (2023, February 28). *How Duolingo reignited user growth*. Lenny's Newsletter. https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth
- Yu, A. (2020, November 19). *Improving the streak: Forming habits one lesson at a time*. Duolingo Blog. https://blog.duolingo.com/improving-the-streak

## Books

- Brown, P. C., Roediger, H. L., III, & McDaniel, M. A. (2014). *Make it stick: The science of successful learning*. Belknap Press of Harvard University Press.
- Chou, Y. (2015). *Actionable gamification: Beyond points, badges, and leaderboards*. Octalysis Media. (Later edition: Packt, 2019.)
- Clear, J. (2018). *Atomic habits: An easy & proven way to build good habits & break bad ones*. Avery.
- Csikszentmihalyi, M. (1990). *Flow: The psychology of optimal experience*. Harper & Row.
- Ericsson, A., & Pool, R. (2016). *Peak: Secrets from the new science of expertise*. Houghton Mifflin Harcourt.
- Eyal, N. (2014). *Hooked: How to build habit-forming products*. Portfolio/Penguin.
- Fogg, B. J. (2019). *Tiny habits: The small changes that change everything*. Houghton Mifflin Harcourt.
- Hermans, F. (2021). *The programmer's brain: What every programmer needs to know about cognition*. Manning Publications.
- Kapp, K. M. (2012). *The gamification of learning and instruction: Game-based methods and strategies for training and education*. Pfeiffer.
- Oakley, B. (2014). *A mind for numbers: How to excel at math and science (even if you flunked algebra)*. Jeremy P. Tarcher/Penguin.
- Oakley, B., Sejnowski, T., & McConville, A. (2018). *Learning how to learn: How to succeed in school without spending all your time studying*. TarcherPerigee.
- Pólya, G. (1945). *How to solve it: A new aspect of mathematical method*. Princeton University Press.
- Willingham, D. T. (2009). *Why don't students like school? A cognitive scientist answers questions about how the mind works and what it means for the classroom*. Jossey-Bass.
