// scripts/server.js
const path = require("path");
const fs = require("fs/promises");
const express = require("express");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const QUESTIONS_FILE = path.join(DATA_DIR, "questions.json");
const RESPONSES_FILE = path.join(DATA_DIR, "responses.jsonl");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function toArray(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeSurveyBody(body) {
  const clean = (x) => (typeof x === "string" ? x.trim() : x);

  return {
    submittedAt: new Date().toISOString(),
    answers: {
      q1: clean(body.q1 || ""),
      q2: clean(body.q2 || ""),
      q3: clean(body.q3 || ""),
      q4: clean(body.q4 || ""),
      q5: toArray(body.q5).map(clean).filter(Boolean),
      q6: clean(body.q6 || "")
    }
  };
}

async function appendResponse(respObj) {
  await ensureDataDir();
  await fs.appendFile(RESPONSES_FILE, JSON.stringify(respObj) + "\n", "utf8");
}

async function loadQuestions() {
  try {
    const raw = await fs.readFile(QUESTIONS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { title: "Survey", questions: {}, options: {} };
  }
}

async function readResponses(limit = 200) {
  try {
    const raw = await fs.readFile(RESPONSES_FILE, "utf8");
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);

    const out = [];
    for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
      try {
        out.push(JSON.parse(lines[i]));
      } catch {
        // ignore malformed lines
      }
    }
    return out;
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

function initCounts(values) {
  const o = {};
  for (const v of values) o[v] = 0;
  o.__other = 0;
  return o;
}

function buildSummary(responses, questions) {
  const opts = (qid) => questions?.options?.[qid] || [];

  const summary = {
    totalResponses: responses.length,
    q3: initCounts(opts("q3")),
    q4: initCounts(opts("q4")),
    q5: initCounts(opts("q5"))
  };

  for (const r of responses) {
    const a = r.answers || {};

    // q3
    if (a.q3 && summary.q3[a.q3] !== undefined) summary.q3[a.q3]++;
    else if (a.q3) summary.q3.__other++;

    // q4
    if (a.q4 && summary.q4[a.q4] !== undefined) summary.q4[a.q4]++;
    else if (a.q4) summary.q4.__other++;

    // q5 (multi)
    for (const c of toArray(a.q5)) {
      if (c && summary.q5[c] !== undefined) summary.q5[c]++;
      else if (c) summary.q5.__other++;
    }
  }

  return summary;
}

module.exports = function (app) {
  // Parse JSON for REST API
  app.use(express.json({ limit: "1mb" }));

  // -------------------------
  // Multi-form survey routes
  // -------------------------
  app.get("/", (req, res) => res.redirect("/survey/1"));
  app.get("/survey", (req, res) => res.redirect("/survey/1"));

  app.get("/survey/1", (req, res) => {
    res.render("survey_step1", { answers: {} });
  });

  app.post("/survey/2", (req, res) => {
    const answers = { q1: req.body.q1 || "", q2: req.body.q2 || "" };
    res.render("survey_step2", { answers });
  });

  app.post("/survey/3", (req, res) => {
    const answers = {
      q1: req.body.q1 || "",
      q2: req.body.q2 || "",
      q3: req.body.q3 || "",
      q4: req.body.q4 || ""
    };
    res.render("survey_step3", { answers });
  });

  // Final submit: save to file and redirect to analyst page
  app.post("/submit", async (req, res, next) => {
    try {
      const respObj = normalizeSurveyBody(req.body);
      await appendResponse(respObj);
      res.redirect("/results");
    } catch (e) {
      next(e);
    }
  });

  // -------------------------
  // Analyst/results view (server-side accessible)
  // -------------------------
  app.get("/results", async (req, res, next) => {
    try {
      const questions = await loadQuestions();
      const responses = await readResponses(200);
      const summary = buildSummary(responses, questions);

      res.render("results", { questions, responses, summary });
    } catch (e) {
      next(e);
    }
  });

  // -------------------------
  // REST APIs (required)
  // -------------------------

  // Add response via API
  app.post("/api/responses", async (req, res, next) => {
    try {
      const respObj = normalizeSurveyBody(req.body);
      await appendResponse(respObj);
      res.status(201).json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  // Get responses (latest first)
  app.get("/api/responses", async (req, res, next) => {
    try {
      const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 200));
      const responses = await readResponses(limit);
      res.json({ ok: true, responses });
    } catch (e) {
      next(e);
    }
  });

  // Get summary counts for charts
  app.get("/api/summary", async (req, res, next) => {
    try {
      const questions = await loadQuestions();
      const responses = await readResponses(500);
      const summary = buildSummary(responses, questions);
      res.json({ ok: true, summary });
    } catch (e) {
      next(e);
    }
  });

  // -------------------------
  // Error handling
  // -------------------------
  app.use((req, res) => res.status(404).send("404 Not Found"));
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("500 Server Error");
  });
};