# Phase 1 Extension — Batches 10, 11, 12 Curriculum Plan (Days 64–84)

## Context

Phase 1 (A1) currently runs days 1–63. This plan extends A1 reinforcement to
day 84 by laying out **21 calendar days** of new curriculum, split into
**3 batches of 7 calendar days each**. Previous single-shot generation attempts
timed out, so the planning deliverable is structured as three clearly delimited
7-day sections inside one combined plan doc so each batch can be implemented as
an independent JSON-generation session later.

**Scope of this document:** plan only. No curriculum JSON files are generated
here. Full day schemas, vocab entries, listening dialogues, quizzes, and
speaking scenarios are produced in subsequent per-batch implementation sessions.

## Day number logic (recap)

Per `CLAUDE.md`, `currentDay % 4 === 0` is a revision day with no JSON file.
Within days 64–84 that gives:

- Revision stubs (no file needed): 64, 68, 72, 76, 80, 84 → **6 revision days**
- Content days: 65, 66, 67, 69, 70, 71, 73, 74, 75, 77, 78, 79, 81, 82, 83 →
  **15 content days**

Each 7-day batch therefore contains 5 content days + 2 revision stubs.

## Sub-batch split

| Batch | Calendar days | Content days |
|-------|----------------|--------------|
| 10    | 64–70         | 65, 66, 67, 69, 70 |
| 11    | 71–77         | 71, 73, 74, 75, 77 |
| 12    | 78–84         | 78, 79, 81, 82, 83 |

## Uniqueness strategy

All grammar titles and vocab words below have been cross-checked against
`scripts/curriculum-index.json` (lastDay: 63) to guarantee they are new.
Any near-miss with an existing entry is called out in the per-batch uniqueness
notes.

---

## Batch 10 — Days 64–70

| Day | Topic | Grammar point | Vocab theme | 5 standard words | 7 advanced words | Listening scenario | Speaking scenario |
|-----|-------|----------------|-------------|-------------------|--------------------|---------------------|---------------------|
| 64 | *Revision* | — | — | — | — | — | — |
| 65 | Days of the Week & Time of Day | Articles with Days & Time of Day (le lundi / lundi / le matin / l'après-midi) | Weekdays and times of day | lundi, mardi, mercredi, samedi, dimanche | lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche | Two friends compare weekly schedules and find a time to meet | Describe what you do on each day of the week |
| 66 | People in General | Quelqu'un / Personne / Quelque chose / Rien (Indefinite Pronouns) | Extended family | le cousin, la cousine, l'oncle, la tante, le mari | le cousin, la cousine, l'oncle, la tante, le mari, le neveu, la nièce | A family reunion: someone introduces cousins and aunts to a new partner | Describe your extended family to a new friend |
| 67 | In the Kitchen | Boire (Present Tense — Irregular Verb) | Kitchen appliances & prep verbs | le frigo, le four, la casserole, couper, mélanger | le frigo, le four, le micro-ondes, la casserole, la poêle, couper, mélanger | A cooking class teacher walks students through a simple recipe | Describe a simple dish you like to cook at home |
| 68 | *Revision* | — | — | — | — | — | — |
| 69 | Describing Things by Appearance | Irregular Adjectives (beau, nouveau, vieux + bel/nouvel/vieil before vowel) | Extended colors | noir, jaune, vert, bleu, gris | noir, jaune, vert, bleu, gris, violet, marron | A shopper describes a painting they want to buy for a new apartment | Describe a beautiful place or object you saw recently |
| 70 | Personality & Character | Adverbs of Manner (-ment suffix formation) | Personality traits | sympathique, timide, sérieux, drôle, patient | sympathique, timide, sérieux, drôle, patient, méchant, généreux | Two colleagues describe a new team member's personality at lunch | Describe the personality of a close friend |

### Batch 10 — Uniqueness notes
- "le mari" and family words above not in index (day 10 covered immediate family only).
- "le frigo" distinct from any prior vocab; index has no kitchen appliances.
- "noir, jaune, vert, bleu, gris, violet, marron" — day 14 covered only `blanc` and `rouge`.
- "sympathique, timide, sérieux, drôle, patient, méchant, généreux" — personality space is new (day 25 covered physical descriptors only).
- Grammar: Quelqu'un/Personne/… is distinct from "Avoir mal à + Extended Negation" (day 19).
- Grammar: Irregular Adjectives (beau/nouveau/vieux) distinct from day 14's Adjective Agreement & Placement.
- Grammar: Adverbs of Manner (-ment) distinct from day 23's Adverbs of Frequency & Time.

---

## Batch 11 — Days 71–77

| Day | Topic | Grammar point | Vocab theme | 5 standard words | 7 advanced words | Listening scenario | Speaking scenario |
|-----|-------|----------------|-------------|-------------------|--------------------|---------------------|---------------------|
| 71 | Going Out at Night | Irregular -IR Verbs (sortir, partir, dormir, sentir) | Nightlife venues | la sortie, le bar, la boîte, le ticket, la soirée | la sortie, le bar, la boîte, le pub, le ticket, la soirée, danser | Two flatmates plan a Friday night out and decide where to go | Invite a friend out and agree on a plan for Saturday night |
| 72 | *Revision* | — | — | — | — | — | — |
| 73 | Accessories & Small Items | Mettre (Present Tense — Irregular Verb) | Clothes accessories | le sac à main, la cravate, les lunettes, le parapluie, le portefeuille | le sac à main, la cravate, la bague, les lunettes, le parapluie, le portefeuille, le collier | A mother reminds a teenager what to put on before going out | Describe what you usually put on before leaving the house |
| 74 | Months & Dates | Dates (le + number + month + year; le premier) | Months of the year | janvier, février, mars, avril, juillet | janvier, février, mars, avril, mai, juin, juillet | A receptionist books an appointment and confirms the exact date | Give your birthday and ask about someone else's |
| 75 | Big Numbers | Numbers 100–1,000,000 (cent, mille, million — agreement of cent/mille) | Numbers & counting | cent, mille, million, compter, le nombre | cent, mille, million, milliard, le nombre, le chiffre, compter | A shopper hears prices for furniture in a big store | Tell someone how much things typically cost where you live |
| 76 | *Revision* | — | — | — | — | — | — |
| 77 | Time Past & Future | Il y a + duration (ago) vs Dans + duration (in) | Days relative to today | hier, demain, aujourd'hui, la veille, le lendemain | hier, demain, aujourd'hui, la veille, le lendemain, auparavant, tout à l'heure | A friend recounts what happened yesterday and plans for tomorrow | Describe what you did yesterday and what you'll do tomorrow |

### Batch 11 — Uniqueness notes
- "le sac à main" is a compound noun distinct from "le sac" (day 13).
- "le ticket" distinct from "le billet" (day 22): both translate to "ticket" but are different lexemes.
- Months and days-relative-to-today words are new; the index has no dated vocab.
- Grammar: Irregular -IR (sortir/partir/dormir) distinct from Regular -IR (day 11).
- Grammar: "Il y a + duration" is a temporal meaning distinct from day 6's "Il y a + place" (existence/location).
- Grammar: Dates builds on but does not duplicate day 59's Ordinal Numbers (overlap only on "premier").

---

## Batch 12 — Days 78–84

| Day | Topic | Grammar point | Vocab theme | 5 standard words | 7 advanced words | Listening scenario | Speaking scenario |
|-----|-------|----------------|-------------|-------------------|--------------------|---------------------|---------------------|
| 78 | On the Phone | Venir de + Infinitive (Recent Past — standard track) | Phone conversations | allô, le numéro, composer, raccrocher, rappeler | allô, le numéro, composer, raccrocher, rappeler, répondre, la sonnerie | A caller reaches the wrong number and tries to redial | Leave a short voicemail asking someone to call you back |
| 79 | At the Airport | Spelling-Change Verbs (-cer / -ger: commencer, manger, voyager) | Air travel | l'aéroport, le vol, le bagage, l'embarquement, atterrir | l'aéroport, le vol, le bagage, l'embarquement, le pilote, atterrir, décoller | A traveller asks about a delayed flight at the airport information desk | Check in at an airport counter and hand over your luggage |
| 80 | *Revision* | — | — | — | — | — | — |
| 81 | Studying & School Life | Si + Present (General Truths & First Conditional intro) | Education & academics | le lycée, l'université, la rentrée, la note, l'élève | le collège, le lycée, l'université, la rentrée, la note, l'élève, la matière | A student compares homework loads with a classmate | Tell someone what you study and what subjects you prefer |
| 82 | Sports & Exercise | Quand as Temporal Conjunction (quand + present) | Common sports | le foot, le tennis, la natation, nager, courir | le foot, le tennis, la natation, le basket, le ski, nager, courir | Two runners plan a weekly training routine together | Describe the sports you practise and how often |
| 83 | News & Media | Mieux vs Meilleur (adverb vs adjective) | Journalism & reporting | le journaliste, l'article, l'actualité, le reportage, publier | le journaliste, l'article, l'actualité, les informations, le reportage, diffuser, publier | A news editor reviews which story is the best for the front page | Say what kind of news you follow and which source you prefer |
| 84 | *Revision* | — | — | — | — | — | — |

### Batch 12 — Uniqueness notes
- Phone vocab avoids "le téléphone / le portable / le message / l'internet / le site / le clavier / la souris" (day 61).
- Education vocab avoids "apprendre / examen / école / bibliothèque / cahier / professeur / stylo" (day 27) and "bureau / collègue / patron / emploi / ordinateur / réunion / travail" (day 41).
- Sports vocab avoids "sport / jouer / chanson / lecture / peinture / randonnée / dessin" (day 21).
- News vocab avoids "émission / chaîne / journal / nouvelles / programme / documentaire / présentateur" (day 55).
- Grammar: Venir de + infinitive was only on day 39 *advanced*; pulling it into standard is allowed per CLAUDE.md (no duplicate grammar **titles** in the index).
- Grammar: Mieux vs meilleur distinct from Comparative Adjectives (day 25) and Superlative (day 33); focuses specifically on adverb/adjective distinction.
- Grammar: Si + present distinct from any prior grammar title.
- Grammar: Quand as conjunction distinct from Question Formation (day 18), which used it as a question word.

---

## Uniqueness master list (all new)

### 15 new grammar titles
1. Articles with Days & Time of Day
2. Quelqu'un / Personne / Quelque chose / Rien (Indefinite Pronouns)
3. Boire (Present Tense — Irregular Verb)
4. Irregular Adjectives (beau, nouveau, vieux)
5. Adverbs of Manner (-ment suffix formation)
6. Irregular -IR Verbs (sortir, partir, dormir, sentir)
7. Mettre (Present Tense — Irregular Verb)
8. Dates (le + number + month + year)
9. Numbers 100–1,000,000
10. Il y a + duration vs Dans + duration
11. Venir de + Infinitive (Recent Past)
12. Spelling-Change Verbs (-cer / -ger)
13. Si + Present (General Truths)
14. Quand as Temporal Conjunction
15. Mieux vs Meilleur

### New vocab words (75 total across 15 content days)
Verified absent from `scripts/curriculum-index.json` vocabWords:

- Day 65: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche
- Day 66: le cousin, la cousine, l'oncle, la tante, le mari, le neveu, la nièce
- Day 67: le frigo, le four, le micro-ondes, la casserole, la poêle, couper, mélanger
- Day 69: noir, jaune, vert, bleu, gris, violet, marron
- Day 70: sympathique, timide, sérieux, drôle, patient, méchant, généreux
- Day 71: la sortie, le bar, la boîte, le pub, le ticket, la soirée, danser
- Day 73: le sac à main, la cravate, la bague, les lunettes, le parapluie, le portefeuille, le collier
- Day 74: janvier, février, mars, avril, mai, juin, juillet
- Day 75: cent, mille, million, milliard, le nombre, le chiffre, compter
- Day 77: hier, demain, aujourd'hui, la veille, le lendemain, auparavant, tout à l'heure
- Day 78: allô, le numéro, composer, raccrocher, rappeler, répondre, la sonnerie
- Day 79: l'aéroport, le vol, le bagage, l'embarquement, le pilote, atterrir, décoller
- Day 81: le collège, le lycée, l'université, la rentrée, la note, l'élève, la matière
- Day 82: le foot, le tennis, la natation, le basket, le ski, nager, courir
- Day 83: le journaliste, l'article, l'actualité, les informations, le reportage, diffuser, publier

---

## Follow-up sessions

No curriculum JSON files are generated in this session. Each of the three
batches is implemented in its own follow-up session:

- Batch 10 session → produces `public/curriculum/phase1/day065.json`,
  `day066.json`, `day067.json`, `day069.json`, `day070.json`.
- Batch 11 session → produces `day071.json`, `day073.json`, `day074.json`,
  `day075.json`, `day077.json`.
- Batch 12 session → produces `day078.json`, `day079.json`, `day081.json`,
  `day082.json`, `day083.json`.

Revision days (64, 68, 72, 76, 80, 84) are computed in code per `CLAUDE.md` —
no JSON files are created for them.

After each batch ships JSON, append the new grammar titles and vocab words to
`scripts/curriculum-index.json` and bump `lastDay`. Never regenerate the index
from scratch.

Once day084 ships, update `CLAUDE.md` (folder structure comment) from
`day001.json → day063.json` to `day001.json → day084.json`.
