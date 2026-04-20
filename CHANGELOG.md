# Changelog

## [0.5.0](https://github.com/lucaskarsten/Viare/compare/kali-platform-v0.4.0...kali-platform-v0.5.0) (2026-04-20)


### Features

* add test infrastructure — unit, integration, security, e2e ([#26](https://github.com/lucaskarsten/Viare/issues/26)) ([1c529ab](https://github.com/lucaskarsten/Viare/commit/1c529abd2ca5bf8360210e244478f11cc3005251))
* labs duais (CTF + INTERACTIVE) + enrich contextual ([#27](https://github.com/lucaskarsten/Viare/issues/27)) ([49551a4](https://github.com/lucaskarsten/Viare/commit/49551a4ee867be26ddbc46f74a9ecc5f3b913fbf))


### Bug Fixes

* **auth:** protect /courses and sibling (platform) routes in proxy ([#28](https://github.com/lucaskarsten/Viare/issues/28)) ([49fd7d2](https://github.com/lucaskarsten/Viare/commit/49fd7d28f3091bed82e9a5f86a01692771c7bb5b))
* summary bold rendering, title spacing; remove ENABLE_MIXED_LESSONS flag ([#24](https://github.com/lucaskarsten/Viare/issues/24)) ([fd20739](https://github.com/lucaskarsten/Viare/commit/fd207392b7be1b10cf02a716174ee74bf68403ff))

## [0.4.0](https://github.com/lucaskarsten/Viare/compare/kali-platform-v0.3.0...kali-platform-v0.4.0) (2026-04-20)


### Features

* certificates — PDF generation, verify page, sidebar link ([0c00e5e](https://github.com/lucaskarsten/Viare/commit/0c00e5ea87a330096de3750d8259669541c50c23))
* pedagogical overhaul — PRACTICE, CASE_STUDY, REFLECTION lesson types ([#21](https://github.com/lucaskarsten/Viare/issues/21)) ([a8f3fdb](https://github.com/lucaskarsten/Viare/commit/a8f3fdb48691b251e47ec2ec55defda1ac208101))
* phase 3 polish — lesson type badges, kind labels, emphasis hints ([#23](https://github.com/lucaskarsten/Viare/issues/23)) ([bd7e5fc](https://github.com/lucaskarsten/Viare/commit/bd7e5fc12e271e7c05bb6ec582237b1ef46271d4))
* scope control — replace decorative depth/pace/format with wired scope picker ([6205277](https://github.com/lucaskarsten/Viare/commit/62052770e3e4631e793b426abc8fd699dc93508a))


### Bug Fixes

* scope picker — remove time hints, calibrate course hour ranges per scope ([1c7fe0d](https://github.com/lucaskarsten/Viare/commit/1c7fe0ded29f03aa3acc8366fa04178789664249))

## [0.3.0](https://github.com/lucaskarsten/Viare/compare/kali-platform-v0.2.0...kali-platform-v0.3.0) (2026-04-20)


### Features

* domain classifier (Haiku Step 0) — context-aware sandbox and demo injection per lesson ([c910994](https://github.com/lucaskarsten/Viare/commit/c910994116cf49e331f1d54252a40421fa52ce96))
* generation prompt — teach AI to emit :::sandbox and ::demo directives ([1c53878](https://github.com/lucaskarsten/Viare/commit/1c538788c80977db6a8421a7d4b411ac80ae1386))
* interactive demo blocks — BubbleSort, BinarySearch, CssFlexbox visualizers ([49bc033](https://github.com/lucaskarsten/Viare/commit/49bc03339bcf23246fa4e4e7300c3cce5f4a77eb))
* interactive lesson blocks — callouts, cards, steps, lab redesign, quiz transitions ([e1d49cd](https://github.com/lucaskarsten/Viare/commit/e1d49cd3059898387efd45196b4374ffecaf404f))
* labs API — GET lab data and POST flag submission with attempt tracking ([79802ab](https://github.com/lucaskarsten/Viare/commit/79802ab542778b46363c76d327ed7a022c081034))
* lesson page — load lab data for LAB-type lessons via getLabForUser ([b29ae8e](https://github.com/lucaskarsten/Viare/commit/b29ae8e31473a493b9932fe7a44aa0586aad4927))
* quiz API — POST attempt scoring, persistence, and lesson completion ([4525158](https://github.com/lucaskarsten/Viare/commit/45251587d5a3dc70e63f22501b34bdd7155f2866))
* review API — GET due cards and SM-2 rating endpoint ([2cc859a](https://github.com/lucaskarsten/Viare/commit/2cc859aafc3558a2f33f7030327cea4bc0ac26c4))
* Sandpack integration — interactive sandbox blocks in lessons ([604af5b](https://github.com/lucaskarsten/Viare/commit/604af5b6abdd424a16aded230c80eeb5359b27fc))
* schema — QuizAttempt, ReviewCard, CardReview, LabAttempt, HintReveal, UserXP models ([fd9a43a](https://github.com/lucaskarsten/Viare/commit/fd9a43aa2c0d1940557a0b75e2e8eab8a1872092))
* SM-2 spaced repetition algorithm and lab utility lib ([e8d4dc5](https://github.com/lucaskarsten/Viare/commit/e8d4dc5b81f6aa1a6a16cb95fd1513dffaaf2037))
* wire ReviewClient to real API and auto-generate flashcards on lesson complete ([ba4c2ff](https://github.com/lucaskarsten/Viare/commit/ba4c2ff3a13677c11630e4d1304cd32955a1d55c))


### Bug Fixes

* resolve all lint errors — BubbleSort effect, unused vars, prettier ([c766f7a](https://github.com/lucaskarsten/Viare/commit/c766f7ad76dd7a1005bac3e35a91c8eb7fd308ed))

## [0.2.0](https://github.com/lucaskarsten/Viare/compare/kali-platform-v0.1.0...kali-platform-v0.2.0) (2026-04-19)

### Features

- add CourseCategory enum to schema, backfill existing courses ([cc51261](https://github.com/lucaskarsten/Viare/commit/cc51261b3d9441fa5ec732f11158ddf98a5bb83b))
- add i18n support, fix accent palette token and sidebar counts ([1ca211e](https://github.com/lucaskarsten/Viare/commit/1ca211eeda22da1c52f7e6147ae3d7423d08df64))
- add lesson content for all 64 seeded lessons ([7b2948b](https://github.com/lucaskarsten/Viare/commit/7b2948b555824ac965493694f644c5745fc95b28))
- add lesson, goals and feed CSS from styles-2.css prototype ([889d89f](https://github.com/lucaskarsten/Viare/commit/889d89f078a400dd02a984cfd8994a6f380da21f))
- align catalog page with prototype design ([036c506](https://github.com/lucaskarsten/Viare/commit/036c506daf72d42c1cb12c498adc3ca123e46e75))
- CSS workflow, content safety pipeline and platform identity ([#3](https://github.com/lucaskarsten/Viare/issues/3)) ([3e04cde](https://github.com/lucaskarsten/Viare/commit/3e04cde501431128cc8a7e491a102664f480193f))
- design system overhaul + 5 new platform features ([#1](https://github.com/lucaskarsten/Viare/issues/1)) ([d892e36](https://github.com/lucaskarsten/Viare/commit/d892e36819afaad4ffeaf28dc2456cc3ca6263dc))
- i18n generate course page ([9eca5e6](https://github.com/lucaskarsten/Viare/commit/9eca5e6ed93230a5429cdefaedda14660b1d423a))
- i18n onboarding flow (4 steps, interests, preferences) ([3a5f031](https://github.com/lucaskarsten/Viare/commit/3a5f031dc22071abf7367b3f4044faa2d98e6fb0))
- i18n pass on enroll, login and global search ([5d3403b](https://github.com/lucaskarsten/Viare/commit/5d3403b095449169e75d8a094987921e11392dd8))
- i18n pass on lesson/course/goals/flashcard components ([49a3c7b](https://github.com/lucaskarsten/Viare/commit/49a3c7bda274ac53817e4f78c1dcddc9485798e7))
- initial commit ([698307f](https://github.com/lucaskarsten/Viare/commit/698307ff5cd021d23e68593eb90ad3297d226b4f))
- integrate catalog with DB data and new pixel-perfect design ([310e5d9](https://github.com/lucaskarsten/Viare/commit/310e5d9b1eb6a4f5aa05274d6e5aea006c8bda1f))
- live course generation page with polling progress endpoint ([670f605](https://github.com/lucaskarsten/Viare/commit/670f6053a6ef7a6a3f7301d7045027dfc1ba3ea0))
- markdown rendering, vite@8 upgrade e Node 24 ([99f6f93](https://github.com/lucaskarsten/Viare/commit/99f6f93e23fa28086e193754021ffcd335f7fab3))
- multi-source generation and course enrich endpoint ([143280f](https://github.com/lucaskarsten/Viare/commit/143280f42c930dbb54b92cc77fb57e66af03f6bd))
- pixel-perfect implementation of all platform screens ([#2](https://github.com/lucaskarsten/Viare/issues/2)) ([56dbe12](https://github.com/lucaskarsten/Viare/commit/56dbe12d038f3f8e67ce53438f923d6f068b73f3))
- pixel-perfect prototype alignment — microcopy, layout, data and UX polish ([de28657](https://github.com/lucaskarsten/Viare/commit/de2865720267040f6d04bd53549c1441e4a7fb4c))
- pixel-perfect redesign — all screens aligned to design system ([fd3c6f5](https://github.com/lucaskarsten/Viare/commit/fd3c6f5d23939f6dcb87552f84bd570e6ab4cc8e))
- plataforma inicial completa com geração de cursos por IA, TDD e infraestrutura Claude Code ([94a423c](https://github.com/lucaskarsten/Viare/commit/94a423ca84ab5f70053d77119dfcad7b8ee8af14))
- quiz questions, rating tokens, lesson i18n ([7258a6d](https://github.com/lucaskarsten/Viare/commit/7258a6dc3eec4df88f1f4e8bef653ff89eafa208))
- remove next-themes, update layout and sidebar display name ([717d27f](https://github.com/lucaskarsten/Viare/commit/717d27f4117ac5e7f2b0382280ae22ee54c03445))

### Bug Fixes

- render lesson content as proper markdown with GFM support ([#17](https://github.com/lucaskarsten/Viare/issues/17)) ([7c49f46](https://github.com/lucaskarsten/Viare/commit/7c49f462857cc366fb547373bc1c1344997378c6))
