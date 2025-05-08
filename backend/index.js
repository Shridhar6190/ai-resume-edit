import express from "express";
import multer from "multer";
// import pdfParse from "pdf-parse";
import fs from "fs/promises";
import { PDFDocument, rgb } from "pdf-lib";
import { OpenAI } from "openai";
import { config } from "dotenv";
import cors from "cors";
import { ChatOpenAI } from "@langchain/openai";
import { mkdir } from "fs/promises";
import { z } from "zod";

config();

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// // Set up multer to save files to disk
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, `resume-${Date.now()}.pdf`);
  },
});
const upload = multer({ storage });

const openai = new OpenAI();

app.post("/api/clean-resume", upload.single("resume"), async (req, res) => {
  try {
    console.log("Received request to clean resume");
    const uploadedFilePath = req.file.path;
    // const { default: pdfParse } = await import("pdf-parse");
    console.log("Uploaded File Path:", uploadedFilePath);

    // 1. Read and extract text from uploaded PDF
    const fileBuffer = await fs.readFile(uploadedFilePath);
    const parsed = await pdfParse(fileBuffer);
    const resumeText = parsed.text;
    console.log("Extracted Text:", resumeText);

    // 2. Use OpenAI to redact PII
    const prompt = `
You are an AI assistant. Remove all personal information (name, email, phone, address, LinkedIn, GitHub, etc.) from the following resume.

--- RESUME START ---
${resumeText}
--- RESUME END ---
`;

    // const completion = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{ role: "user", content: prompt }],
    //   temperature: 0,
    // });

    // const cleanedText = completion.choices[0].message.content;

    // 3. Create new PDF from cleaned text
    // const cleanedPdf = await PDFDocument.create();
    // let page = cleanedPdf.addPage();
    // const { height } = page.getSize();
    // const fontSize = 12;
    // const lines = cleanedText.split("\n");

    // let y = height - 40;
    // for (const line of lines) {
    //   if (y < 40) {
    //     page = cleanedPdf.addPage();
    //     y = height - 40;
    //   }
    //   page.drawText(line.trim(), {
    //     x: 50,
    //     y,
    //     size: fontSize,
    //     color: rgb(0, 0, 0),
    //   });
    //   y -= fontSize + 4;
    // }

    // const outputBuffer = await cleanedPdf.save();

    // // 4. Save cleaned PDF to disk
    // const outputFilePath = `./cleaned/cleaned-resume-${Date.now()}.pdf`;
    // await fs.writeFile(outputFilePath, outputBuffer);

    // // 5. Return the cleaned PDF
    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader(
    //   "Content-Disposition",
    //   "attachment; filename=cleaned_resume.pdf"
    // );
    // res.send(outputBuffer);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).send("Failed to process resume");
  }
});

// Ensure upload/cleaned folders exist
await mkdir("./uploads", { recursive: true });
await mkdir("./cleaned", { recursive: true });

// app.post("/api/clean-text", express.json(), async (req, res) => {
//   const { text } = req.body;
//   console.log("Received request to clean text");

//   const prompt = `
//   You are an AI assistant that redacts personal information from resumes. Remove all personally identifiable information (name, email, phone, address, LinkedIn, GitHub, etc.) from the resume below.

//   Return the cleaned resume as a valid JSON object using this format:

//   {
//     "Name": "[Redacted]"
//     "Email": "[Redacted]"
//     "Phone": "[Redacted]"
//     "LinkedIn": "[Redacted]"
//     "Github": "[Redacted]"
//     "Address": "[Redacted]"
//     "Website": "[Redacted]"
//     "summary": "Short summary of the candidate's profile",
//     "experience": [
//       {
//         "role": "Job Title",
//         "company": "Company Name",
//         "dates": "Start - End",
//         "description": "Work responsibilities and achievements"
//         "technologies": ["Tech 1", "Tech 2"]
//       }
//     ],
//     "education": [
//       {
//         "degree": "Degree",
//         "institution": "University Name",
//         "dates": "Start - End"
//       }
//     ],
//     "skills": ["Skill 1", "Skill 2", "Skill 3"]
//   }

//   Only return a valid JSON object. Do not include any additional commentary or text.

//   --- RESUME START ---
//   ${text}
//   --- RESUME END ---
//   `;

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4o",
//     messages: [{ role: "user", content: prompt }],
//     temperature: 0,
//     response_format: { type: "json_object" }, // This is not enforced unless you use OpenAI's JSON mode — see note below
//   });

//   // Handle and parse JSON response
//   let cleanedData;
//   try {
//     console.log("LLM Response:", completion.choices[0].message.content);
//     cleanedData = JSON.parse(completion.choices[0].message.content);
//   } catch (err) {
//     console.error("❌ Error parsing JSON:", err);
//     return res.status(500).json({ error: "Failed to parse JSON from LLM." });
//   }

//   res.json({ cleanedResume: cleanedData });
// });

app.post("/api/clean-text", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'text' field in request body." });
    }

    console.log("Received request to clean text");

    // Define Zod schema for structured resume
    const resumeSchema = z.object({
      name: z.string().describe("Candidate's name Redacted"),
      email: z.string().describe("Candidate's email address Redacted"),
      phone: z.string().describe("Candidate's phone number Redacted"),
      linkedIn: z
        .string()
        .describe("Candidate's LinkedIn profile URL Redacted"),
      github: z.string().describe("Candidate's GitHub profile URL Redacted"),
      address: z.string().describe("Candidate's address Redacted"),
      website: z.string().describe("Candidate's personal website URL Redacted"),
      summary: z
        .string()
        .describe("Short summary of the candidate's experience and skills"),
      experience: z
        .array(
          z.object({
            role: z.string().describe("Job title"),
            company: z.string().describe("Company name"),
            dates: z.string().describe("Employment dates (Start - End)"),
            description: z
              .string()
              .describe("Work responsibilities and achievements"),
            technologies: z
              .array(z.string())
              .describe("List of technologies used"),
          })
        )
        .describe("List of professional experiences"),
      education: z
        .array(
          z.object({
            degree: z.string().describe("Degree obtained"),
            institution: z.string().describe("University or institution name"),
            dates: z.string().describe("Education dates (Start - End)"),
          })
        )
        .describe("Educational background"),
      skills: z.array(z.string()).describe("List of key skills"),
    });

    const prompt = `
  You are an AI assistant that redacts personal information from resume.
  Remove all personally identifiable information (name, email, phone, address, LinkedIn, GitHub, etc.) from the resume below.
  Pls don't redact the companby and insitution names.
  Return the cleaned resume as a valid JSON following the provided schema.
  Only include fields that were present in the original resume.
  Use the string "Redacted" for personal information fields.
      
  Resume:
  ${text}
  `;

    // Call LLM with structured output
    const model = new ChatOpenAI({
      modelName: "gpt-4o",
    });

    const modelWithStructure = model.withStructuredOutput(resumeSchema);

    const structuredOutput = await modelWithStructure.invoke(prompt);

    console.log("Structured Output:", structuredOutput);

    res.json({ cleanedResume: structuredOutput });
  } catch (err) {
    console.error("Error cleaning resume:", err);

    // LangChain/OpenAI errors
    if (err instanceof Error && err.message.includes("OpenAI")) {
      return res
        .status(502)
        .json({ error: "Error communicating with OpenAI API." });
    }

    // Zod validation errors (if any, but usually caught internally)
    if (err instanceof z.ZodError) {
      return res
        .status(422)
        .json({ error: "Invalid output structure", details: err.errors });
    }

    // General error fallback
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
