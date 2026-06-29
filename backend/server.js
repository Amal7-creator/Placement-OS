require("dotenv").config();

console.log(
  "API Key Loaded:",
  !!process.env.GEMINI_API_KEY
);

const express = require("express");
const cors = require("cors");
const {
  GoogleGenerativeAI
} = require("@google/generative-ai");

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "10mb"
  })
);

const PORT =
  process.env.PORT || 3000;

// ==========================
// GEMINI SETUP
// ==========================

if (!process.env.GEMINI_API_KEY) {

  console.error(
    "❌ GEMINI_API_KEY missing in .env"
  );

  process.exit(1);

}

const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

const model =
  genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

// ==========================
// GLOBAL FORMAT RULES
// ==========================

const FORMAT_RULES = `
IMPORTANT FORMAT RULES:

1. Use numbered headings.

Example:

1. Main Topic
   a. Explanation
   b. Details

2. Next Topic
   a. Explanation
   b. Details

2. Use letters for subpoints.

3. Return plain text only.

4. Do not use markdown.

5. Do not use ###.

6. Do not use **.

7. Do not use bullet symbols:
   *
   -
   •

8. Do not use tables.

9. Start directly with section 1.

10. No greetings.
`;

// ==========================
// UTILITY FUNCTIONS
// ==========================

async function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );

}

async function generateWithRetry(
  prompt,
  retries = 5
) {

  for (
    let attempt = 1;
    attempt <= retries;
    attempt++
  ) {
        try {

      const result =
        await model.generateContent(
          prompt
        );

      const response =
        await result.response;

      const text =
        response.text();

      if (
        text &&
        text.trim()
      ) {

        return text;

      }

      throw new Error(
        "Empty AI response"
      );

    } catch (error) {

      console.error(
        `Attempt ${attempt} failed:`,
        error.message
      );

      if (
        attempt === retries
      ) {

        throw error;

      }

     await sleep(5000);

    }

  }

}

// ==========================
// RESPONSE FORMATTER
// ==========================

function formatAIResponse(text) {

    if (!text) return "";

    return text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/\*\*/g, "")
        .replace(/^###\s*/gm, "")
        .replace(/`/g, "")
        .trim();

}

// ==========================
// HEALTH CHECK
// ==========================

app.get(
  "/",
  (req, res) => {

    res.json({
      success: true,
      server:
        "Placement OS AI",
      status:
        "Running",
      model:
        "gemini-2.5-flash"
    });

  }
);

// ==========================
// AI TUTOR
// ==========================

app.post(
  "/ask-ai",
  async (
    req,
    res
  ) => {

    try {

      const {
        question,
        history
      } = req.body;

      const conversation =
        (history || [])
        .slice(-20)
        .map(
          m =>
            `${m.type}: ${m.text}`
        )
        .join("\n");

      const prompt = `
You are Placement OS AI Tutor.

Focus Areas:

Aptitude
Logical Reasoning
Verbal Ability
DSA
Technical Interviews
HR Interviews
Resume Building

Conversation:
${conversation}

User Question:
${question}

${FORMAT_RULES}
`;
      const answer =
        await generateWithRetry(
          prompt
        );

      res.json({
        success: true,
        answer:
          formatAIResponse(
            answer
          )
      });

    } catch (error) {

      console.error(
        "ASK AI ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });

    }

  }
);

// ==========================
// RESUME ANALYZER
// ==========================

app.post(
  "/analyze-resume",
  async (
    req,
    res
  ) => {

    try {

      const {
        resumeText
      } = req.body;

      if (
        !resumeText
      ) {

        return res
          .status(400)
          .json({
            success: false,
            error:
              "Resume text required"
          });

      }

      const prompt = `
You are an ATS expert.

Analyze the resume.

Return:

1. Resume Score
   a. Score out of 100
   b. Explanation

2. ATS Score
   a. Score out of 100
   b. Explanation

3. Strengths
   a. Point
   b. Point

4. Weaknesses
   a. Point
   b. Point

5. Missing Skills
   a. Point
   b. Point

6. Missing Keywords
   a. Point
   b. Point

7. Suggested Improvements
   a. Point
   b. Point

8. Interview Readiness
   a. Percentage
   b. Reason

9. Final Verdict
   a. Summary

Resume:

${resumeText}

${FORMAT_RULES}
`;

      const answer =
        await generateWithRetry(
          prompt
        );

      res.json({
        success: true,
        answer:
          formatAIResponse(
            answer
          )
      });

    } catch (error) {

      console.error(
        "RESUME ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });

    }

  }
);

// ==========================
// MOCK INTERVIEW
// ==========================

app.post(
  "/mock-interview",
  async (
    req,
    res
  ) => {
        try {

      const {
        prompt
      } = req.body;

      if (!prompt) {

        return res
          .status(400)
          .json({
            success: false,
            error:
              "Prompt required"
          });

      }

      const answer =
        await generateWithRetry(
          prompt
        );

      res.json({
        success: true,
        result:
          formatAIResponse(
            answer
          )
      });

    } catch (error) {

      console.error(
        "MOCK INTERVIEW ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });

    }

  }
);

// ==========================
// NEXT QUESTION ROUTE
// ==========================

app.post(
  "/next-question",
  async (
    req,
    res
  ) => {

    try {

      const {
        role,
        previousQuestions,
        previousAnswers
      } = req.body;

      const prompt = `
You are a senior technical interviewer.

Role:
${role}

Previous Questions:
${JSON.stringify(
  previousQuestions
)}

Previous Answers:
${JSON.stringify(
  previousAnswers
)}

Generate ONE NEW question.

Rules:

1. Do not repeat.
2. Increase difficulty.
3. Match role.
4. Return question only.
`;

      const question =
        await generateWithRetry(
          prompt
        );

      res.json({
        success: true,
        question:
          question.trim()
      });

    } catch (error) {

      console.error(
        "NEXT QUESTION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });

    }

  }
);

// ==========================
// SCORE ANSWER
// ==========================

app.post(
  "/score-answer",
  async (
    req,
    res
  ) => {

    try {

      const {
        question,
        answer,
        role
      } = req.body;

     const prompt = `
You are an experienced ${role} interviewer.

Evaluate the candidate's answer honestly.

Question:
${question}

Candidate Answer:
${answer}

Scoring Rules:
- Technical: 0-10
- Communication: 0-10
- Problem Solving: 0-10
- Confidence: 0-10
- Overall: 0-10

Do NOT give every category the same score unless the answer truly deserves it.

Base the scores on the actual quality of the answer.

Return ONLY valid JSON:

{
  "technical": 0,
  "communication": 0,
  "problemSolving": 0,
  "confidence": 0,
  "overall": 0,
  "feedback": "Explain why these scores were given."
}
`;
     const result = await generateWithRetry(prompt);
     console.log("========== GEMINI SCORE RESPONSE ==========");
console.log(result);
console.log("==========================================");

// Remove ```json and ``` if Gemini returns them
const cleanResult = result
  .replace(/```json/gi, "")
  .replace(/```/g, "")
  .trim();

let parsed;

try {

  parsed = JSON.parse(cleanResult);

} catch (err) {

  console.log("Invalid JSON from Gemini:");
  console.log(cleanResult);

  parsed = {
    technical: 0,
    communication: 0,
    problemSolving: 0,
    confidence: 0,
    overall: 0,
    feedback: cleanResult
  };

}

      res.json({
        success: true,
        result: parsed
      });

    } catch (error) {

      console.error(
        "SCORE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });

    }

  }
);

// ==========================
// INTERVIEW REPORT
// ==========================

app.post(
  "/interview-report",
  async (
    req,
    res
  ) => {

    try {

      const {
        role,
        scores,
        feedbacks
      } = req.body;

    const prompt = `
You are a senior HR interviewer.

Candidate Role:
${role}

Interview Scores:
${JSON.stringify(scores)}

Question Feedback:
${JSON.stringify(feedbacks)}

Write a professional interview report.

Do NOT repeat the JSON.

Do NOT show scores again.

Generate only this report:

# Overall Performance

# Strengths

- point
- point

# Weaknesses

- point
- point

# Suggestions

- point
- point

# Hiring Recommendation

One paragraph.

# Interview Readiness

Percentage out of 100.

Write in clean English.

No JSON.

No markdown code blocks.

No triple backticks.
`;;

      const report =
        await generateWithRetry(
          prompt
        );

        console.log("========== GEMINI REPORT ==========");
console.log(report);
console.log("==================================");

      res.json({
        success: true,
        report:
          formatAIResponse(
            report
          )
      });

    } catch (error) {

      console.error(
        "REPORT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });

    }

  }
);

// ==========================
// GENERATE QUESTION
// ==========================

app.post(
  "/generate-question",
  async (req, res) => {

    try {

      const {
        language,
        difficulty,
        topic,
        company
      } = req.body;

      const prompt = `

Generate ONE DSA coding question.

Language:
${language}

Difficulty:
${difficulty}

Topic:
${topic}

Company:
${company}

If company is not General,
generate a question similar to the style asked by that company.

Return:

1. Problem Statement
2. Example Input
3. Example Output
4. Constraints
5. Expected Time Complexity

${FORMAT_RULES}
`;
      const question =
        await generateWithRetry(
          prompt
        );

      res.json({
        success: true,
        question:
          formatAIResponse(
            question
          )
      });

    } catch (error) {

      console.error(
        "QUESTION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });

    }

  }
);

// ==========================
// ANALYZE CODE
// ==========================

app.post(
  "/analyze-code",
  async (
    req,
    res
  ) => {

    try {

      const {
        code,
        language
      } = req.body;
            if (
        !code ||
        !language
      ) {

        return res
          .status(400)
          .json({
            success: false,
            error:
              "Missing code or language"
          });

      }

      const prompt = `
You are a senior software engineer.

Language:
${language}

Code:
${code}

Analyze the code.

Return:

1. Correctness
   a. Explanation
   b. Issues Found

2. Time Complexity
   a. Complexity
   b. Reason

3. Space Complexity
   a. Complexity
   b. Reason

4. Optimized Solution
   a. Improved Code
   b. Explanation

5. Interview Feedback
   a. Score Out Of 100
   b. Recommendations

IMPORTANT:

- Use numbered sections.
- Use lettered subsections.
- No markdown.
- No bullet points.
- Return clean text only.

${FORMAT_RULES}
`;

      const result =
        await generateWithRetry(
          prompt
        );

      if (!result) {

        return res
          .status(500)
          .json({
            success: false,
            error:
              "Empty AI response"
          });

      }

      res.json({
        success: true,
        result:
          formatAIResponse(
            result
          )
      });

    } catch (error) {

      console.error(
        "ANALYZE CODE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });

    }

  }
);




// ==========================
// RUN CODE
// ==========================

app.post(
  "/run-code",
  async (
    req,
    res
  ) => {

    try {

      const {
        code,
        language
      } = req.body;

      if (
        !code ||
        !language
      ) {

        return res
          .status(400)
          .json({
            success: false,
            error:
              "Missing code or language"
          });

      }

      const prompt = `
Act as a code execution simulator.

Language:
${language}

Code:
${code}

Return ONLY the exact output.

If there is an error, return the error message exactly.

Do not explain anything.
Do not add markdown.
`;

      const result =
        await generateWithRetry(
          prompt
        );

      res.json({
        success: true,
        output: result
      });

    } catch (error) {

      console.error(
        "RUN CODE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });

    }

  }
);



// ==========================
// DSA HINT
// ==========================

app.post(
  "/dsa-hint",
  async (req, res) => {

    try {

      const { question } = req.body;

      const prompt = `
You are a DSA mentor.

Question:

${question}

Give ONLY a hint.

Do NOT give the full solution.

Keep it short.
`;

      const hint =
        await generateWithRetry(prompt);

      res.json({
        success: true,
        hint
      });

    } catch (error) {

      console.error(
        "DSA HINT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message
      });

    }

  }
);

// ==========================
// DSA SOLUTION
// ==========================

app.post(
  "/dsa-solution",
  async (req, res) => {

    try {

      const {
        question,
        language
      } = req.body;

      const prompt = `
You are a senior DSA instructor.

Question:

${question}

Language:

${language}

Return:

1. Approach
2. Algorithm
3. Code
4. Time Complexity
5. Space Complexity

${FORMAT_RULES}
`;

      const solution =
        await generateWithRetry(prompt);

      res.json({
        success: true,
        solution
      });

    } catch (error) {

      console.error(
        "DSA SOLUTION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message
      });

    }

  }
);

// ==========================
// 404 HANDLER
// ==========================

app.use(
  (
    req,
    res
  ) => {

    res.status(404).json({
      success: false,
      error:
        "Route not found"
    });

  }
);

// ==========================
// GLOBAL ERROR HANDLER
// ==========================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      "GLOBAL ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      error:
        "Internal Server Error"
    });

  }
);

// ==========================
// START SERVER
// ==========================

app.listen(
  PORT,
  () => {

    console.log(
      "================================="
    );

    console.log(
      "🚀 Placement OS AI Running"
    );

    console.log(
      `🌐 Port: ${PORT}`
    );

    console.log(
      "🤖 Model: gemini-2.5-flash"
    );

    console.log(
      "================================="
    );

  }
);





