let resumeText = "";

// ===========================
// CURRENT USER STORAGE KEY
// ===========================

function getResumeKey() {

    const uid = localStorage.getItem("userUID");

    if (!uid) {
        return "resume_guest";
    }

    return `resume_${uid}`;
}

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

function goBack() {
  window.location.href = "index.html";
}

function copyReport() {
  const text = document.getElementById("output").innerText;

  navigator.clipboard.writeText(text);

  alert("Report copied successfully");
}

function downloadReport() {

  const report =
    document.getElementById("output").innerText;

  if (!report.trim()) {
    alert("No report available.");
    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(
    "Placement OS Resume Analysis Report",
    15,
    20
  );

  doc.setFontSize(11);

  const lines =
    doc.splitTextToSize(
      report,
      180
    );

  doc.text(
    lines,
    15,
    35
  );

  doc.save(
    "resume-analysis.pdf"
  );
}

async function analyzeWithAI(prompt) {
  try {
    const response = await fetch(
      "https://placement-os-8s7f.onrender.com/analyze-resume",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resumeText: prompt
        })
      }
    );

    const data = await response.json();

    if (data.success) {
      return data.answer;
    }

    return "❌ " + data.error;

  } catch (error) {
    console.error(error);
    return "❌ Cannot connect to AI server.";
  }
}

async function analyzeResume() {

  const file =
    document.getElementById("fileInput").files[0];

  const output =
    document.getElementById("output");

  const status =
    document.getElementById("status");

  if (!file) {
    alert("Please upload a PDF resume.");
    return;
  }

  status.innerText = "Extracting resume text...";

  const reader = new FileReader();

  reader.onload = async function () {

    try {

      const typedarray =
        new Uint8Array(this.result);

      const pdf =
        await pdfjsLib
          .getDocument(typedarray)
          .promise;

      let text = "";

      for (
        let i = 1;
        i <= pdf.numPages;
        i++
      ) {

        const page =
          await pdf.getPage(i);

        const content =
          await page.getTextContent();

        text +=
          content.items
            .map(item => item.str)
            .join(" ");

        text += "\n";
      }

      resumeText = text;

      status.innerText =
        "Analyzing Resume...";

      const prompt = `
Analyze this resume for placement readiness.

Return:
Resume Score: X/100
ATS Score: X/100
Strengths:
Weaknesses:
Improvements:
Interview Readiness:

Resume:
${text.slice(0, 5000)}
`;

      const result =
        await analyzeWithAI(prompt);

      output.innerText = result;

      // DEBUGGING
      console.log("AI Result:");
      console.log(result);

      const resumeMatch =
        result.match(
          /Resume\s*Score[\s\S]{0,50}?(\d+)\s*\/\s*100/i
        );

      const atsMatch =
        result.match(
          /ATS\s*Score[\s\S]{0,50}?(\d+)\s*\/\s*100/i
        );

      console.log("Resume Match:", resumeMatch);
      console.log("ATS Match:", atsMatch);

      const resumeScore =
        resumeMatch
          ? parseInt(resumeMatch[1])
          : 0;

      const atsScore =
        atsMatch
          ? parseInt(atsMatch[1])
          : 0;

      document.getElementById(
        "resumeScore"
      ).innerText =
        resumeScore || "--";

      document.getElementById(
        "atsScore"
      ).innerText =
        atsScore || "--";

      document.getElementById(
        "resumeBar"
      ).style.width =
        resumeScore + "%";

      document.getElementById(
        "atsBar"
      ).style.width =
        atsScore + "%";

      status.innerText =
        "Analysis Completed ✅";

        // Save only for current user
localStorage.setItem(getResumeKey(), JSON.stringify({

    resumeText,
    report: result,
    resumeScore,
    atsScore,
    fixes: ""

}));

    } catch (error) {

      console.error(error);

      status.innerText =
        "Analysis Failed ❌";

      output.innerText =
        error.message;
    }
  };

  reader.readAsArrayBuffer(file);
}

async function generateFixes() {

  if (!resumeText) {
    alert("Please analyze a resume first.");
    return;
  }

  const fixBox =
    document.getElementById("fixBox");

  fixBox.innerHTML =
    "Generating checklist...";

    // Update saved data
const saved = JSON.parse(
    localStorage.getItem(getResumeKey()) || "{}"
);

saved.fixes = fixBox.innerHTML;

localStorage.setItem(
    getResumeKey(),
    JSON.stringify(saved)
);

  const prompt = `
Create ATS resume improvement checklist.

Formatting Fixes:
Keyword Fixes:
Skills To Add:
Project Improvements:
Summary Improvements:
Final Actions:

Resume:
${resumeText.slice(0, 5000)}
`;

  const result =
    await analyzeWithAI(prompt);

  fixBox.innerHTML =
    result
      .split("\n")
      .filter(line => line.trim())
      .map(
        line =>
          `<div class="badge">${line}</div>`
      )
      .join("");
}

window.goBack = goBack;
window.copyReport = copyReport;
window.downloadReport = downloadReport;
window.analyzeResume = analyzeResume;
window.generateFixes = generateFixes;

console.log("resume.js loaded successfully");

// ===========================
// LOAD CURRENT USER RESUME
// ===========================

(function(){

    const saved = JSON.parse(
        localStorage.getItem(getResumeKey()) || "null"
    );

    if(!saved) return;

    resumeText = saved.resumeText || "";

    document.getElementById("output").innerHTML =
        saved.report || "Upload a resume to generate AI report...";

    document.getElementById("resumeScore").innerText =
        saved.resumeScore || "--";

    document.getElementById("atsScore").innerText =
        saved.atsScore || "--";

    document.getElementById("resumeBar").style.width =
        (saved.resumeScore || 0) + "%";

    document.getElementById("atsBar").style.width =
        (saved.atsScore || 0) + "%";

    document.getElementById("fixBox").innerHTML =
        saved.fixes ||
        "Upload and analyze resume to get improvement checklist...";

})();