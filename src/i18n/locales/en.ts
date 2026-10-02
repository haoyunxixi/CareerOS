/**
 * English interface strings.
 *
 * This file is the reference dictionary: `TranslationKey` is derived from it,
 * so adding a key here forces every other locale to add it too.
 *
 * Long-form content (companies, roles, feedback) lives in `src/data`, not here.
 */
export const en = {
  "common.appName": "CareerOS",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.close": "Close",
  "common.required": "Required",

  "nav.primary": "Primary",
  "nav.compact": "Primary, compact",
  "nav.home": "Home",
  "nav.opportunities": "Opportunities",
  "nav.opportunitiesShort": "Jobs",
  "nav.resume": "Resume",
  "nav.interview": "Interview",
  "nav.journey": "Journey",
  "nav.bubble": "Bubble",

  "resume.title": "Resume",
  "resume.note":
    "Your base resume and interview story bank — one place that keeps accumulating.",
  "resume.basic.title": "Basic resume",
  "resume.basic.edit": "View & edit profile",
  "resume.basic.summary": "{exp} experiences · {skills} skills",
  "resume.basic.target": "Target roles",
  "resume.stories.title": "Story Bank",
  "resume.stories.note":
    "STAR stories distilled across your interviews, shown as summaries. Open one to keep shaping it.",
  "resume.stories.coverage": "{covered} / {total} behavioural dimensions covered",
  "resume.stories.missing": "{count} to complete",
  "resume.stories.open": "Open story",
  "resume.stories.empty":
    "No stories yet. Open an interview's preparation tab and shape your first STAR story.",
  "resume.story.back": "Back to Story Bank",
  "resume.story.summary": "One-line summary",
  "resume.story.source": "Source experience",
  "resume.story.dimensions": "Behavioural story dimensions",
  "resume.story.notFound": "This story could not be found.",

  "lang.label": "Language",

  "greeting.morning": "Good morning, {name}.",
  "greeting.afternoon": "Good afternoon, {name}.",
  "greeting.evening": "Good evening, {name}.",
  "home.headline": "Let's focus on what matters today.",

  "today.label": "Today",
  "today.contextLabel": "Last round",
  "today.prepareLabel": "Prepare first",
  "today.cta": "Prepare next round",

  "stat.applications": "Active applications",
  "stat.interviews": "Upcoming interview",
  "stat.skills": "Skills to improve",

  "section.opportunities": "Opportunities",
  "section.viewAll": "View all",
  "section.growth": "Your current focus",
  "section.growthNote": "Drawn from your latest interview reviews",
  "section.bubble": "Latest thought",
  "section.bubbleAction": "View memories",

  "opportunities.applied": "Applied {day}",

  "jobs.title": "My opportunities",
  "jobs.description":
    "Keep every opportunity, application and interview in one place.",
  "jobs.addCta": "Add opportunity",
  "jobs.empty":
    "No opportunities yet. Add your first one to start a job context.",
  "jobs.back": "All opportunities",

  "jobs.status.interested": "Interested",
  "jobs.status.applied": "Applied",
  "jobs.status.interviewing": "Interviewing",
  "jobs.status.closed": "Closed",

  "jobs.item.nextInterview": "Next interview {when}",
  "jobs.item.nextFollowUp": "Follow up {when}",
  "jobs.item.applied": "Applied {day}",

  "jobs.detail.tabsAria": "Job sections",
  "jobs.detail.tab.overview": "Overview",
  "jobs.detail.tab.jdAnalysis": "JD analysis",
  "jobs.detail.tab.analysis": "Analysis",
  "jobs.detail.tab.prepare": "Preparation",
  "jobs.detail.tab.mock": "Mock",
  "jobs.detail.analysis.takeaways": "Key takeaways",
  "jobs.detail.analysis.jdExpand": "Full JD analysis",
  "jobs.detail.analysis.matchExpand": "Match evidence",
  "jobs.detail.analysis.matchSummary":
    "{strong} supported · {partial} partial · {gaps} gaps",
  "jobs.detail.tab.resume": "Resume",
  "jobs.detail.tab.interview": "Interview",
  "jobs.detail.tab.review": "Review",
  "jobs.detail.statusLabel": "Status",

  "jobs.overview.summary": "Summary",
  "jobs.overview.jd": "Original job description",
  "jobs.overview.jdEmpty": "No JD pasted yet.",
  "jobs.overview.nextStep": "Next step",
  "jobs.overview.nextStepEmpty": "No next step recorded.",
  "jobs.overview.nextStepInterview": "Interview on {when}",
  "jobs.overview.nextStepFollowUp": "Follow up on {when}",
  "jobs.overview.nextStepDecision": "Decision expected {when}",

  "jobs.jdAnalysis.title": "What is this role really asking for?",
  "jobs.jdAnalysis.roleSummary": "Role summary",
  "jobs.jdAnalysis.responsibilities": "Core responsibilities",
  "jobs.jdAnalysis.requirements": "Key requirements",
  "jobs.jdAnalysis.requirements.skills": "Skills",
  "jobs.jdAnalysis.requirements.experience": "Experience",
  "jobs.jdAnalysis.requirements.domain": "Domain knowledge",
  "jobs.jdAnalysis.requirements.soft": "Soft skills",
  "jobs.jdAnalysis.keywords": "Important keywords",
  "jobs.jdAnalysis.mostImportant": "What seems most important",
  "jobs.jdAnalysis.note":
    "Mock analysis for Phase 2. The real AI pipeline will replace this block in the next phase.",

  "jobs.tab.placeholder.title": "Reserved for a later phase",
  "jobs.tab.placeholder.note":
    "This section will hold resume, interview, or review material linked to the same job. We are focusing on understanding the JD first.",

  "jobs.detail.tab.match": "Match",

  "jobs.match.title": "What can you already stand behind?",
  "jobs.match.note":
    "CareerOS only counts evidence that exists in your Career Profile. Gaps are not a judgement — they are signals to either surface more of your work, or decide what to do next.",
  "jobs.match.summary.strong": "Strong evidence",
  "jobs.match.summary.partial": "Partial evidence",
  "jobs.match.summary.gaps": "Evidence gaps",
  "jobs.match.count": "{count}",
  "jobs.match.status.supported": "Supported",
  "jobs.match.status.partial": "Partially supported",
  "jobs.match.status.gap": "No evidence yet",
  "jobs.match.importance.must": "Must",
  "jobs.match.importance.should": "Should",
  "jobs.match.importance.nice": "Nice",
  "jobs.match.evidence": "Evidence",
  "jobs.match.evidence.empty":
    "No matching profile items found for this requirement.",
  "jobs.match.evidenceGapNote":
    "Your current profile does not contain evidence that can stand behind this requirement.",
  "jobs.match.nextAction": "What you can do",
  "jobs.match.strengths.title": "Your strongest evidence",
  "jobs.match.strengths.note":
    "These are the moments from your profile that already speak to this role.",
  "jobs.match.gaps.title": "Where evidence is thin",
  "jobs.match.gaps.note":
    "Gap does not mean you lack the skill. It means CareerOS has nothing on file yet that can stand behind it.",
  "jobs.match.nextActions.title": "Where to focus next",
  "jobs.match.nextActions.note":
    "Two to four small moves that would lift the evidence on this job.",
  "jobs.match.openProfile": "Update your career profile",

  "jobs.resume.title": "Resume for this opportunity",
  "jobs.resume.note":
    "CareerOS uses the job requirements and your existing evidence to help you decide what to highlight, improve and strengthen.",

  "jobs.resume.context.targetJob": "Target job",
  "jobs.resume.context.summary": "{strong} Strong · {partial} Partial · {gaps} Gap",
  "jobs.resume.context.evidence.strong": "Strong evidence",
  "jobs.resume.context.evidence.partial": "Partial evidence",
  "jobs.resume.context.evidence.gap": "Evidence gap",
  "jobs.resume.context.note":
    "The guidance below comes from the job requirements and the real experience already in your profile.",

  "jobs.resume.source.title": "Resume source",
  "jobs.resume.source.profile": "Career Profile",
  "jobs.resume.source.profile.help":
    "The draft is built from your existing profile entries.",
  "jobs.resume.source.manual": "Manual paste",
  "jobs.resume.source.manual.label": "Paste your current resume",
  "jobs.resume.source.manual.placeholder":
    "Paste your existing resume text here. CareerOS will not parse it word for word — it will use the pasted text as the basis of the draft.",
  "jobs.resume.source.manual.save": "Use this text",
  "jobs.resume.source.manual.reset": "Reset to Career Profile",
  "jobs.resume.source.manual.saved":
    "Manual paste in use. Switch back to Career Profile to apply Rewrite suggestions to the structured draft.",

  "jobs.resume.section.highlight.title": "What to highlight",
  "jobs.resume.section.highlight.note":
    "Real experiences from your profile that already speak to this role. Move them up, give them more room.",
  "jobs.resume.section.rewrite.title": "Improve the wording",
  "jobs.resume.section.rewrite.note":
    "CareerOS rephrases descriptions you have already written. It will not invent a fact you did not provide.",
  "jobs.resume.section.evidence.title": "Evidence to strengthen",
  "jobs.resume.section.evidence.note":
    "Gaps and weak evidence from Match. Add the missing facts to your profile or CV — do not invent numbers.",

  "jobs.resume.card.type.highlight": "Highlight",
  "jobs.resume.card.type.rewrite": "Rewrite",
  "jobs.resume.card.type.gap": "Evidence gap",
  "jobs.resume.card.type.needs_confirmation": "Needs your input",
  "jobs.resume.card.whyItMatters": "Why it matters",
  "jobs.resume.card.current": "Current",
  "jobs.resume.card.suggested": "Suggested",
  "jobs.resume.card.focusOn": "Focus on",
  "jobs.resume.card.beforeWeCanRewrite": "Before we can rewrite this, please confirm",
  "jobs.resume.card.relatedRequirement": "Related requirement",
  "jobs.resume.card.evidenceSource": "Evidence source",
  "jobs.resume.card.cta.apply": "Apply suggestion",
  "jobs.resume.card.cta.keep": "Keep original",
  "jobs.resume.card.cta.undo": "Undo",
  "jobs.resume.card.cta.confirm": "I've answered these",
  "jobs.resume.card.status.applied": "Applied",
  "jobs.resume.card.status.kept": "Kept original",
  "jobs.resume.card.status.confirmed": "Confirmed",
  "jobs.resume.card.status.pending": "Pending",
  "jobs.resume.card.evidence.empty": "Not linked to a profile item.",

  "jobs.resume.draft.title": "Target resume draft",
  "jobs.resume.draft.note":
    "A working draft of what you would send for this job. Edit inline. Suggestions you accept will appear here.",

  "jobs.resume.draft.section.education": "Education",
  "jobs.resume.draft.section.experience": "Experience",
  "jobs.resume.draft.section.skills": "Skills",
  "jobs.resume.draft.section.manual": "Pasted resume",
  "jobs.resume.draft.empty": "Nothing in this section yet.",
  "jobs.resume.draft.itemHint": "Edit directly. Changes stay local.",
  "jobs.resume.draft.itemFromSuggestion": "Updated by suggestion",
  "jobs.resume.draft.addItem": "Add item",
  "jobs.resume.draft.removeItem": "Remove",
  "jobs.resume.draft.sourceNote.profile":
    "Draft is seeded from your Career Profile. Apply a Rewrite to update an entry.",
  "jobs.resume.draft.sourceNote.manual":
    "Draft is based on the resume text you pasted. Editing here will not change your Career Profile.",
  "jobs.resume.draft.lockedReason":
    "Apply is disabled while the manual paste is active. Switch back to Career Profile to update structured entries.",

  "jobs.resume.highlight.empty":
    "Nothing in your profile stands out as a clear highlight for this role yet.",
  "jobs.resume.rewrite.empty":
    "No rewrites suggested for the moment — your existing descriptions already speak to this role.",
  "jobs.resume.gap.empty":
    "No evidence gaps to surface right now. Run Match again after you edit your profile.",
  "jobs.resume.principle":
    "CareerOS will not invent experiences, results, or numbers. It can find evidence already in your profile, suggest better wording, or point out what is missing.",

  "jobs.interview.title": "Prepare for this interview",
  "jobs.interview.note":
    "Prepare around the job requirements, your evidence and the resume you are using for this opportunity.",

  "jobs.interview.context.title": "Interview context",
  "jobs.interview.context.company": "Company",
  "jobs.interview.context.role": "Role",
  "jobs.interview.context.stage": "Stage",
  "jobs.interview.context.stage.screening": "Recruiter screen",
  "jobs.interview.context.stage.first_round": "First round",
  "jobs.interview.context.stage.second_round": "Second round",
  "jobs.interview.context.stage.final_round": "Final round",
  "jobs.interview.context.stage.other": "Other",
  "jobs.interview.context.edit": "Edit",
  "jobs.interview.context.done": "Done",
  "jobs.interview.context.scheduledAt": "Scheduled for",
  "jobs.interview.context.scheduledAt.empty": "Not scheduled yet",
  "jobs.interview.context.resumeVersion": "Using resume",
  "jobs.interview.context.resumeVersion.value": "Target Resume Draft V1",

  "jobs.interview.focus.title": "Today's focus",
  "jobs.interview.focus.note":
    "The 2–4 things that would lift this round the most. Each one is anchored to a row in Match or Resume, never random.",
  "jobs.interview.focus.from.requirement": "From requirement",
  "jobs.interview.focus.from.evidence": "From evidence",
  "jobs.interview.focus.from.resume_recommendation": "From resume",

  "jobs.interview.questions.title": "Questions to prepare",
  "jobs.interview.questions.note":
    "Context-aware questions tied to this role and your Career Profile. Expand a question to draft your answer.",
  "jobs.interview.questions.category.motivation": "Motivation",
  "jobs.interview.questions.category.experience": "Experience",
  "jobs.interview.questions.category.role": "Role understanding",
  "jobs.interview.questions.category.business": "Business understanding",
  "jobs.interview.questions.category.gap": "Weak-point drill",
  "jobs.interview.questions.filterAll": "All",
  "jobs.interview.questions.why": "Why this may be asked",
  "jobs.interview.questions.relatedRequirement": "Related requirement",
  "jobs.interview.questions.evidenceToUse": "Evidence you can use",
  "jobs.interview.questions.answerDraft": "My answer draft",
  "jobs.interview.questions.answerPlaceholder":
    "Write your own draft here. CareerOS will not write it for you.",
  "jobs.interview.questions.framework": "Suggested structure",
  "jobs.interview.questions.framework.STAR":
    "STAR — Situation · Task · Action · Result",
  "jobs.interview.questions.framework.structured":
    "Structured — Context · Decision · Action · Learning",
  "jobs.interview.questions.framework.needResult":
    "If you do not have a numeric Result yet, write the learning or qualitative feedback you actually received.",
  "jobs.interview.questions.framework.case":
    "Case — Clarify · Analyse · Prioritise · Recommend · Validate",
  "jobs.interview.questions.framework.narrative":
    "Narrative — Transition · Motivation · Evidence · Role connection",
  "jobs.interview.questions.expand": "Draft answer",
  "jobs.interview.questions.collapse": "Hide draft",
  "jobs.interview.questions.status.not_started": "Not started",
  "jobs.interview.questions.status.drafting": "Drafting",
  "jobs.interview.questions.status.ready": "Ready",
  "jobs.interview.questions.empty":
    "No context-aware questions generated for this job yet.",

  "jobs.interview.selfIntro.title": "Self introduction",
  "jobs.interview.selfIntro.note":
    "A 60-second draft. CareerOS recommends the 2–3 stories most worth lifting from your Story Bank. The text is yours — it is never written for you.",
  "jobs.interview.selfIntro.recommended": "Recommended stories for your intro",
  "jobs.interview.selfIntro.direction": "Core narrative direction",
  "jobs.interview.selfIntro.draft": "60-second draft",
  "jobs.interview.selfIntro.structure": "Suggested structure",
  "jobs.interview.selfIntro.structure.body":
    "Who I am · Why this role · Most relevant evidence · Why this opportunity",

  "jobs.interview.stories.title": "Story bank",
  "jobs.interview.stories.note":
    "Every story is anchored to a real entry in your Career Profile. If a result is still empty, leave it that way — partial stories are honest.",
  "jobs.interview.stories.context": "Context",
  "jobs.interview.stories.actions": "What you actually did",
  "jobs.interview.stories.result": "Result",
  "jobs.interview.stories.resultEmpty": "No result on file yet — leave it empty until you have one.",
  "jobs.interview.stories.learning": "Learning",
  "jobs.interview.stories.relatedRequirements": "Supports",
  "jobs.interview.stories.relatedSkills": "Skills",
  "jobs.interview.stories.situation": "S · The situation",
  "jobs.interview.stories.task": "T · Your task",
  "jobs.interview.stories.toAdd": "To add",
  "jobs.interview.stories.edit": "Edit",
  "jobs.interview.stories.editNote":
    "Only add things that actually happened. No numbers needed — user feedback, delivery status or your own takeaway all count, but never invent.",
  "jobs.interview.stories.dimensionsCovered": "Behavioural story dimensions covered",
  "jobs.interview.stories.incomplete": "stories to complete",
  "jobs.interview.stories.missingPrefix": "Still to add: ",

  "jobs.interview.checklist.title": "Before the interview",
  "jobs.interview.checklist.note":
    "A light checklist. Toggle items as you go; nothing persists yet.",

  "jobs.interview.interviewer.title": "Questions for the interviewer",
  "jobs.interview.interviewer.note":
    "Your own list. Add questions that show you have prepared; remove the ones that no longer apply.",
  "jobs.interview.interviewer.placeholder":
    "Write a question you would actually ask.",
  "jobs.interview.interviewer.add": "Add",
  "jobs.interview.interviewer.remove": "Remove",
  "jobs.interview.interviewer.empty": "Nothing on your list yet.",
  "jobs.interview.interviewer.suggestions": "Suggestions to consider",
  "jobs.interview.interviewer.addSuggestion": "Add",

  "jobs.interview.startMock.title": "Start mock interview",
  "jobs.interview.startMock.note":
    "Run one full practice round with targeted questions before the real interview.",
  "jobs.interview.startMock.cta": "Start mock interview",
  "jobs.interview.minimalNote":
    "There is no curated preparation for this job yet — but you can start a mock round generated from its JD and match evidence right away.",
  "jobs.interview.selfIntro.aiCta": "Draft with AI",
  "jobs.interview.selfIntro.aiLoading": "Drafting…",
  "jobs.interview.selfIntro.aiError":
    "Couldn't generate a draft — you can still write one below.",
  "jobs.interview.questions.expandAll": "View the full question list",
  "jobs.interview.stories.recommended.title": "Stories to bring up",
  "jobs.interview.stories.supportsRequirement":
    "Supports the requirement: {requirement}",
  "jobs.interview.stories.skillsLine": "Covers: {skills}",
  "jobs.interview.stories.view": "View story →",
  "jobs.interview.checklist.summary": "Readiness",
  "jobs.interview.checklist.expand": "View the checklist",
  "interview.prepare.needsJd":
    "Add this job's JD first — CareerOS needs it to build targeted preparation.",
  "jobs.interview.focus.from.interview_review": "Previous interview review",

  "jobs.mock.title": "Mock interview",
  "jobs.mock.backToPrep": "Back to preparation",
  "jobs.mock.start.count": "Practice questions",
  "jobs.mock.start.count.value": "{count} questions",
  "jobs.mock.start.duration": "Estimated time",
  "jobs.mock.start.duration.value": "About 15–20 minutes",
  "jobs.mock.start.focus": "Focus areas",
  "jobs.mock.start.cta": "Start interview",
  "jobs.mock.start.note":
    "One question at a time. Voice is the default — typing is always available. Recordings are sent to a speech-to-text service for transcription and are never permanently stored.",
  "jobs.mock.needsJd.note":
    "Add this job's description first — targeted mock questions are generated from it.",
  "jobs.mock.needsJd.cta": "Add job description",

  "jobs.mock.session.category": "Category",
  "jobs.mock.session.why": "Why this question",
  "jobs.mock.session.evidence": "Evidence you may use",
  "jobs.mock.session.callableStories": "Stories you can call on",
  "jobs.mock.session.evidenceEmpty": "No linked evidence for this question.",
  "jobs.mock.session.answer": "My answer",
  "jobs.mock.session.answerPlaceholder":
    "Answer in your own words — as if you were speaking.",
  "jobs.mock.session.submit": "Submit answer",
  "jobs.mock.session.prev": "Previous",
  "jobs.mock.session.next": "Next question",
  "jobs.mock.session.skip": "Skip",
  "jobs.mock.session.finish": "Finish and see summary",
  "jobs.mock.session.skipped": "Skipped",
  "jobs.mock.session.category.motivation": "Motivation",
  "jobs.mock.session.category.behavioral": "Behavioural",
  "jobs.mock.session.category.project_deep_dive": "Project deep dive",
  "jobs.mock.session.category.requirement": "Job requirement",
  "jobs.mock.session.category.weak_point": "Weak point",
  "jobs.mock.session.category.business": "Business",
  "jobs.mock.session.category.product_case": "Product case",

  "jobs.mock.room.privacyMic":
    "The microphone is used for your mock-interview answers. Recordings are sent to a speech-to-text service for transcription and are never permanently stored.",
  "jobs.mock.room.privacyCamera":
    "The camera is only a local self-view. This version never analyses video.",
  "jobs.mock.room.startRecording": "Start recording",
  "jobs.mock.room.requesting": "Requesting microphone…",
  "jobs.mock.room.recording": "Recording",
  "jobs.mock.room.recordingHint": "Speak as you would in the real interview.",
  "jobs.mock.room.endAnswer": "End answer",
  "jobs.mock.room.retry": "Retry",
  "jobs.mock.room.reanswer": "Answer again",
  "jobs.mock.room.answerByTyping": "Answer by typing instead",
  "jobs.mock.room.answerByVoice": "Answer by voice instead",
  "jobs.mock.room.transcribing": "Transcribing your answer…",
  "jobs.mock.room.transcribeFailed": "Transcription failed. Please try again.",
  "jobs.mock.room.retryTranscribe": "Retry transcription",
  "jobs.mock.room.confirmTranscript": "Confirm transcript",
  "jobs.mock.room.recordAgain": "Record again",
  "jobs.mock.room.framework": "Framework",
  "jobs.mock.room.followUp": "Suggested follow-up",
  "jobs.mock.room.followUpAnswer": "Answer the follow-up",
  "jobs.mock.room.followUpSkip": "Skip the follow-up",
  "jobs.mock.room.followUpSubmit": "Submit follow-up answer",
  "jobs.mock.room.feedbackLoading": "Reviewing your answer…",
  "jobs.mock.room.feedbackFailed":
    "Could not generate feedback. Please try again.",
  "jobs.mock.room.retryFeedback": "Retry",
  "jobs.mock.room.confirmedAnswer": "Your confirmed answer",
  "jobs.mock.room.playback": "Play back your answer",
  "jobs.mock.room.duration": "Duration",
  "jobs.mock.room.transcript": "Transcript",
  "jobs.mock.room.transcriptNote":
    "Automatic transcription can be wrong — correct it before continuing. Feedback is based on the text you confirm.",
  "jobs.mock.room.transcriptPlaceholder": "(no transcript yet)",
  "jobs.mock.room.enableCamera": "Show camera",
  "jobs.mock.room.disableCamera": "Hide camera",
  "jobs.mock.room.micError.not_supported":
    "This browser does not support recording. You can answer by typing instead.",
  "jobs.mock.room.micError.permission_denied":
    "Microphone permission was denied. Re-allow it in browser settings, or answer by typing instead.",
  "jobs.mock.room.micError.no_device":
    "No microphone was found. You can answer by typing instead.",
  "jobs.mock.room.micError.failed":
    "Recording failed. Try again, or answer by typing instead.",
  "jobs.mock.room.cameraError.not_supported":
    "This browser does not support the camera.",
  "jobs.mock.room.cameraError.permission_denied":
    "Camera permission was denied. You can re-allow it in browser settings.",
  "jobs.mock.room.cameraError.no_device": "No camera was found.",
  "jobs.mock.room.cameraError.failed": "The camera failed to start.",

  "jobs.mock.feedback.title": "Feedback",
  "jobs.mock.feedback.note":
    "Feedback is generated from the transcript you confirmed, for reference only. The system never invents experiences or data you did not provide.",
  "jobs.mock.feedback.strengths": "What your answer already covers",
  "jobs.mock.feedback.missing": "What is still missing",
  "jobs.mock.feedback.structure": "Answer structure",
  "jobs.mock.feedback.structure.clear": "Clear structure",
  "jobs.mock.feedback.structure.needsStructure": "Needs more structure",
  "jobs.mock.feedback.expand": "Worth expanding",
  "jobs.mock.feedback.evidence": "Evidence you could still use",
  "jobs.mock.feedback.nextFocus": "Next focus",
  "jobs.mock.feedback.mostValuable": "Most valuable to add",
  "jobs.mock.feedback.status.clear": "clear",
  "jobs.mock.feedback.status.partial": "could be clearer",
  "jobs.mock.feedback.status.missing": "not yet covered",
  "jobs.mock.feedback.star.situation": "Situation — the context",
  "jobs.mock.feedback.star.task": "Task — your own responsibility",
  "jobs.mock.feedback.star.action": "Action — what you specifically did",
  "jobs.mock.feedback.star.result": "Result — the real outcome or learning",
  "jobs.mock.feedback.aspect.claim": "Direct answer",
  "jobs.mock.feedback.aspect.reason": "Reasoning",
  "jobs.mock.feedback.aspect.example": "A real example",
  "jobs.mock.feedback.aspect.job_relevance": "Link to this job",
  "jobs.mock.feedback.aspect.transition": "Transition logic",
  "jobs.mock.feedback.aspect.motivation": "Motivation",
  "jobs.mock.feedback.aspect.evidence": "Evidence behind it",
  "jobs.mock.feedback.aspect.role_connection": "Connection to this role",
  "jobs.mock.feedback.aspect.clarify": "Clarify the problem first",
  "jobs.mock.feedback.aspect.analyse": "Structured analysis",
  "jobs.mock.feedback.aspect.prioritise": "Prioritisation",
  "jobs.mock.feedback.aspect.recommendation": "Recommendation",
  "jobs.mock.feedback.aspect.validation": "How to validate",

  "jobs.mock.summary.title": "Session summary",
  "jobs.mock.summary.answered": "Answered",
  "jobs.mock.summary.skipped": "Skipped",
  "jobs.mock.summary.stable": "Where you were consistent",
  "jobs.mock.summary.weak": "Keep preparing",
  "jobs.mock.summary.evidence": "Evidence involved",
  "jobs.mock.summary.next": "Before the real interview",
  "jobs.mock.summary.save": "Save this session",
  "jobs.mock.summary.saved":
    "Saved. V1 keeps this record in the review history as a demo only — nothing persists after refresh.",
  "jobs.mock.summary.goReview": "View in review",
  "jobs.mock.summary.goPrep": "Back to preparation",
  "jobs.mock.summary.star": "STAR this round",
  "jobs.mock.summary.star.line":
    "{clear} clear · {partial} could be clearer · {missing} missing",
  "jobs.mock.summary.nextEmpty": "No next focus generated this round.",
  "jobs.mock.summary.saveFailed": "Could not save — please try again.",

  "jobs.review.title": "Interview review",
  "jobs.review.note":
    "Keep what actually happened in every interview, so the next round builds on real experience.",
  "jobs.review.history.title": "Interview history",
  "jobs.review.history.empty": "No interviews recorded for this job yet.",
  "jobs.review.type.mock": "Mock interview",
  "jobs.review.type.real": "Real interview",
  "jobs.review.status.completed": "Completed",
  "jobs.review.status.debriefed": "Debriefed",
  "jobs.review.row.viewDetails": "Details",
  "jobs.review.row.hideDetails": "Hide",
  "jobs.review.row.answeredSkipped": "Answered {answered} · Skipped {skipped}",
  "jobs.review.row.strengths": "Consistent",
  "jobs.review.row.weak": "Needs work",
  "jobs.review.row.next": "Next focus",
  "jobs.review.row.questions": "Questions",
  "jobs.review.row.star": "STAR review",
  "jobs.review.debrief.cta": "Debrief an interview",
  "jobs.review.debrief.title": "What just happened?",
  "jobs.review.debrief.note":
    "No need to organise — write down what you remember first.",
  "jobs.review.debrief.placeholder":
    "e.g. They opened with a self introduction, then drilled into CareerOS and why I designed it that way. My data-analysis answer was messy. At the end they said round two may lean more on business…",
  "jobs.review.debrief.organize": "Organise this interview",
  "jobs.review.debrief.back": "Back to history",
  "jobs.review.result.note":
    "V1 demo: this structured draft was not generated from your notes. Check and edit every line — your memory is the source of truth, not this draft.",
  "jobs.review.result.stage": "Interview stage",
  "jobs.review.result.questions": "Questions asked",
  "jobs.review.result.difficult": "What felt difficult",
  "jobs.review.result.signals": "Signals / notes",
  "jobs.review.result.nextFocus": "Possible next-round focus",
  "jobs.review.result.nextRoundNote":
    "Once confirmed, these focus items feed the next round's Today's Focus.",
  "jobs.review.result.addQuestion": "Add question",
  "jobs.review.result.addItem": "Add item",
  "jobs.review.result.remove": "Remove",
  "jobs.review.result.confirm": "Confirm and save",
  "jobs.review.result.confirmed":
    "Debrief saved (V1 demo — nothing persists after refresh).",

  "jobs.review.latest.title": "Latest review",
  "jobs.review.section.mock": "Mock interviews",
  "jobs.review.section.real": "Real interviews",
  "jobs.review.section.mock.empty": "No mock sessions yet — start a round from the prepare tab.",
  "jobs.review.real.title": "Just finished a real interview?",
  "jobs.review.real.note":
    "Paste or upload the interview transcript. CareerOS will organise the questions, surface what the interviewer focused on, and draft your next-round focus.",
  "jobs.review.real.paste": "Paste transcript",
  "jobs.review.real.upload": "Upload transcript file",
  "jobs.review.real.placeholder":
    "Paste the transcript from Feishu, your meeting tool, or your own notes…",
  "jobs.review.real.noteLabel": "Anything you especially want to remember? (optional)",
  "jobs.review.real.notePlaceholder":
    "e.g. The interviewer kept pressing on why DAU dropped — my answer was messy.",
  "jobs.review.real.start": "Start the review",
  "jobs.review.real.loading": "Organising…",
  "jobs.review.real.error":
    "Couldn't analyse the transcript — try again in a moment, or record it manually below.",
  "jobs.review.real.unsupported":
    "This version needs a text export (.txt / .md) — or paste the transcript directly.",
  "jobs.review.real.area.questions": "What was asked",
  "jobs.review.real.area.signals": "What the interviewer focused on",
  "jobs.review.real.area.improvements": "Answers worth improving",
  "jobs.review.real.area.next": "Next-round preparation",
  "jobs.review.real.story.title": "Worth completing this story",
  "jobs.review.real.story.cta": "Complete the story →",
  "jobs.review.real.saved": "Real-interview debrief saved.",

  "home.next.title": "Next action",
  "home.next.cta": "Continue preparing",
  "home.next.focus": "Current focus",
  "home.next.empty": "When an interview invite lands, start preparing here.",
  "home.next.emptyCta": "Add an interview",
  "home.upcoming.title": "Interviews in play",
  "home.learning.title": "Recent learning",
  "home.learning.cta": "View review →",
  "home.learning.from": "Latest review of",

  "profile.title": "Career Profile",
  "profile.description":
    "The context CareerOS uses to understand every job and every question.",
  "profile.editCta": "Edit profile",
  "profile.basic": "Basic",
  "profile.basic.name": "Name",
  "profile.basic.education": "Education",
  "profile.basic.school": "School",
  "profile.basic.major": "Major",
  "profile.basic.degree": "Degree",
  "profile.basic.graduationYear": "Graduation year",
  "profile.basic.targetRoles": "Target roles",
  "profile.basic.targetIndustries": "Target industries",
  "profile.experience": "Experience",
  "profile.experience.empty":
    "No experience added yet. Start with an internship, a project, or a campus role.",
  "profile.experience.type.internship": "Internship",
  "profile.experience.type.campus": "Campus / Organisation",
  "profile.experience.type.research": "Research",
  "profile.experience.type.project": "Project",
  "profile.experience.organization": "Organisation",
  "profile.experience.role": "Role",
  "profile.experience.title": "Title",
  "profile.experience.startDate": "Start",
  "profile.experience.endDate": "End",
  "profile.experience.endDatePresent": "Present",
  "profile.experience.description": "What you did",
  "profile.experience.tags": "Tags",
  "profile.experience.add": "Add experience",
  "profile.experience.remove": "Remove",
  "profile.skills": "Skills",
  "profile.skills.placeholder": "Add a skill, press Enter",
  "profile.skills.empty":
    "No skills listed. Add the ones you already use day to day.",
  "profile.edit.title": "Edit profile",
  "profile.edit.save": "Save profile",
  "profile.edit.skills.label": "Skills",
  "profile.edit.addExperience": "Add an experience",
  "profile.edit.requiredError":
    "Name, school, major and degree are required to save.",

  "jobs.add.title": "Add opportunity",
  "jobs.add.company": "Company",
  "jobs.add.companyPlaceholder": "ByteDance",
  "jobs.add.role": "Job title",
  "jobs.add.rolePlaceholder": "AI Product Operation Intern",
  "jobs.add.location": "Location (optional)",
  "jobs.add.locationPlaceholder": "Beijing",
  "jobs.add.url": "Job URL (optional)",
  "jobs.add.urlPlaceholder": "https://",
  "jobs.add.jd": "JD — paste the posting text",
  "jobs.add.jdPlaceholder":
    "Paste the job description here. CareerOS will read it for you in the next phase.",
  "jobs.add.requiredError":
    "Company, job title and JD are required to save.",
  "jobs.add.saveFailed": "Could not save. Please try again.",

  "time.today": "Today",
  "time.tomorrow": "Tomorrow",
  "time.yesterday": "Yesterday",
  "time.inDays": "In {count} days",
  "time.daysAgo": "{count} days ago",
  "time.at": "{day} {time}",

  "notFound.label": "404",
  "notFound.title": "This page is not part of your journey yet.",
  "notFound.description": "Let us take you back to your career status.",
  "notFound.action": "Back to home",

  "placeholder.planned": "Planned for a later phase",
  "placeholder.note":
    "Phase 1 ships the shell only. This page is intentionally left empty.",

  // --- Phase 8: Global Interview Center ------------------------------------

  "interview.center.title": "My interviews",
  "interview.center.add": "Add interview",
  "interview.case.back": "Back to My interviews",
  "interview.case.notFound": "This interview could not be found.",
  "interview.case.tabsAria": "Interview sections",
  "interview.case.tab.analysis": "Job analysis",
  "interview.case.tab.prepare": "Preparation",
  "interview.case.tab.review": "Review",
  "interview.case.analysis.strengths": "Key strengths",
  "interview.case.analysis.risks": "Risks & evidence gaps",
  "interview.center.note":
    "Every interview in play: company, role, current stage and time. Continue preparing, or read your latest reviews.",
  "interview.center.empty":
    "No interviews in play yet. Add a job under Jobs to get started.",
  "interview.center.next.title": "Next interview",
  "interview.center.next.cta": "Continue preparing",
  "interview.center.jobs.title": "My interviews",
  "interview.center.jobs.prepare": "Prepare",
  "interview.center.jobs.mock": "Mock interview",
  "interview.center.jobs.review": "Review",
  "interview.center.practice.title": "Practice",
  "interview.center.practice.note":
    "Pick a job and jump straight into its mock interview — the same engine and the same context-driven questions as the real thing.",
  "interview.center.practice.select": "Select a job",
  "interview.center.practice.cta": "Start mock interview",
  "interview.center.stories.title": "Story readiness",
  "interview.center.stories.core": "{count} core stories",
  "interview.center.stories.incomplete": "{count} to complete",
  "interview.center.stories.dimensions": "Behavioural story dimensions covered",
  "interview.center.stories.cta": "Shape my stories",
  "interview.center.review.title": "Recent reviews & current focus",
  "interview.center.review.mockSession": "Mock session",
  "interview.center.review.debrief": "Debrief",
  "interview.center.review.currentFocus": "Current focus",

  // --- Phase 9: real-user foundation ----------------------------------------

  "auth.email": "Email",
  "auth.password": "Password",
  "auth.loginCta": "Log in",
  "auth.signupCta": "Sign up",
  "auth.hasAccount": "Already have an account?",
  "auth.noAccount": "No account yet?",
  "auth.tryDemo": "Try the demo first",
  "auth.checkEmail": "Signed up — please confirm via the email we sent, then log in.",
  "auth.error": "Something went wrong. Check your email and password and try again.",
  "auth.notConfigured":
    "This deployment has no login service configured (Supabase). Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, or browse the demo data for now.",
  "auth.logout": "Log out",
  "auth.demoBadge": "Demo",

  // --- Local-first user mode (V1) ---------------------------------------------
  "auth.cloudComingSoon": "Cloud accounts arrive in the official release. You can start on this device — your data stays in this browser.",
  "auth.startLocal": "Start on this device",
  "auth.viewDemo": "View demo",
  "auth.myCareerOS": "My CareerOS",
  "auth.startCta": "Get started",
  "auth.resetLocal": "Reset local data",
  "auth.resetConfirm": "Clear the profile and jobs saved on this device?",
  "home.demoNote": "You're viewing the demo (Alex's job search).",
  "home.startMine": "Start my CareerOS",
  "home.backMine": "Back to my CareerOS",
  "local.notFound": "This item was not found — it may have been cleared.",

  "onboarding.step.1": "About you",
  "onboarding.step.2": "Resume",
  "onboarding.step.3": "Confirm",
  "onboarding.title": "First, meet you",
  "onboarding.note":
    "Just the basics. Your resume is only used to build your career profile and analyse jobs.",
  "onboarding.name": "Name (optional)",
  "onboarding.school": "School",
  "onboarding.major": "Major",
  "onboarding.degree": "Degree",
  "onboarding.gradYear": "Graduation year",
  "onboarding.next": "Next",
  "onboarding.back": "Back",
  "onboarding.busy": "Working…",
  "onboarding.extractFailed": "Extraction failed. Please retry or paste your resume text.",
  "onboarding.saveFailed": "Could not save. Please retry.",
  "onboarding.resume.title": "Upload your real resume",
  "onboarding.resume.note":
    "Text-based PDFs are supported; scanned copies cannot be read yet. You can also paste the text.",
  "onboarding.resume.privacy":
    "Your resume is only used to build your career profile and analyse jobs.",
  "onboarding.resume.uploadPdf": "Upload a PDF resume",
  "onboarding.resume.paste": "Or paste your resume text",
  "onboarding.resume.pastePlaceholder": "Paste your resume here…",
  "onboarding.resume.parseFailed":
    "We could not read this file. Please paste your resume text instead.",
  "onboarding.resume.tooShort": "The resume text is too short — please add more.",
  "onboarding.resume.extract": "Build my draft profile",
  "onboarding.preview.title": "Confirm your career profile",
  "onboarding.preview.note":
    "This is an auto-organised draft. Only add things that actually happened; CareerOS will only use what you confirm for matching and interviews.",
  "onboarding.preview.confirmNote":
    "Anything we could not confirm was left empty — fill it in yourself. We never invent facts for you.",
  "onboarding.preview.experiences": "Experiences",
  "onboarding.preview.noExperiences":
    "No experiences were recognised from the resume — please add them manually.",
  "onboarding.preview.organization": "Organisation / company",
  "onboarding.preview.role": "Role",
  "onboarding.preview.skills": "Skills (separated by 、)",
  "onboarding.preview.confirm": "Confirm & save",

  "home.myJobs": "My jobs",
  "home.nextUp": "Next up",
  "home.emptyProfile": "Let CareerOS get to know you first.",
  "home.emptyProfileCta": "Build my career profile",
  "home.emptyJobs": "No target jobs yet.",
  "home.emptyJobsCta": "Add your first job",
  "home.emptyInterview":
    "No rush to train. Once you add a job, CareerOS prepares from its real JD.",

  // ------------------------------------------------------- journey ---
  "journey.eyebrow": "Career Journey",
  "journey.title": "My career journey",
  "journey.note":
    "What I applied to, what happened, what I learned, and what's next.",
  "journey.focus": "Current focus",
  "journey.focus.star": "Project {part} storytelling needs work",
  "journey.focus.starRepeated": "Project {part} storytelling keeps needing work",
  "journey.filter.label": "Filter",
  "journey.filter.all": "All",
  "journey.filter.interviews": "Interviews",
  "journey.filter.applications": "Applications",
  "journey.filter.thoughts": "Thoughts",
  "journey.event.jobAdded": "Job added",
  "journey.event.mockInterview": "Mock interview",
  "journey.event.realInterview": "Real interview review",
  "journey.event.thought": "Thought",
  "journey.event.review": "Review",
  "journey.event.sessionDone": "Completed {count} answers",
  "journey.next": "Next: ",
  "journey.empty":
    "The journey hasn't started yet. Add a job, or capture a thought.",
  "journey.demoNote": "You're viewing the demo (Alex's career journey).",

  // ------------------------------------------------------- bubble ---
  "bubble.eyebrow": "Bubble Space",
  "bubble.title": "Thoughts",
  "bubble.note":
    "A place for thoughts that do not need to become conclusions yet.",
  "bubble.count": "{count} thoughts",
  "bubble.placeholder": "Write down what's on your mind...",
  "bubble.add": "Add",
  "bubble.linkJob": "Link a job (optional)",
  "bubble.noJob": "No job",
  "bubble.detail.title": "Thought",
  "bubble.linkedJob": "Linked job: ",
  "bubble.delete": "Delete",
  "bubble.deleteConfirm": "Confirm delete",
  "bubble.demoNote": "These thoughts are part of the demo. Start your own:",
} as const;
