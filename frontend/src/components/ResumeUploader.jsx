import React, { useState, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';
import { generateResumePDF } from './ResumeSerivce';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const ResumeUploader = () => {
  const [file, setFile] = useState(null);
  const [modifiedText, setModifiedText] = useState({
    "Name": "[Redacted]",
    "Email": "[Redacted]",
    "Phone": "[Redacted]",
    "LinkedIn": "[Redacted]",
    "Github": "[Redacted]",
    "Address": "[Redacted]",
    "Website": "[Redacted]",
    "summary": "Software Engineer with experience in developing modern dashboards, implementing messaging queues, and optimizing performance using various technologies.",
    "experience": [
      {
        "role": "Software Engineer 2",
        "company": "Probus Smart Things Pvt Ltd",
        "dates": "Jan’24 – Present",
        "description": "Proposed and developed a modern dashboard design using React.js, implemented Kafka messaging queue, designed a workflow for executing commands, used Socket.io for real-time responses, and optimized CSS performance.",
        "technologies": [
          "React.js",
          "Kafka",
          "Socket.io",
          "Tailwind CSS"
        ]
      },
      {
        "role": "Software Engineer",
        "company": "Thinksys Software Pvt. Ltd.",
        "dates": "Jan’22 – Dec’23",
        "description": "Designed a role-based access control system, optimized API performance, developed a helpdesk module with real-time chat, created a paginated API, and collaborated on automated salary slip generation.",
        "technologies": [
          "Web Sockets",
          "Node.js"
        ]
      },
      {
        "role": "Associate Software Engineer",
        "company": "Thinksys Softwares Pvt. Ltd.",
        "dates": "Sep’21 – Dec 21",
        "description": "Participated in code reviews, engaged in continuous learning, supported documentation processes, and contributed to application deployment and maintenance.",
        "technologies": []
      }
    ],
    "education": [
      {
        "degree": "B.Tech in Computer Science",
        "institution": "MJP Rohilkhand University(MJPRU), Bareilly",
        "dates": "Aug 2017 – May 2021"
      },
      {
        "degree": "Class - XII — CBSE",
        "institution": "LPS, Lucknow",
        "dates": "2017"
      }
    ],
    "skills": [
      "JavaScript",
      "TypeScript",
      "Java",
      "SQL",
      "OOPs",
      "AWS",
      "Docker",
      "Kubernetes",
      "Google Map API",
      "GitHub",
      "React.js",
      "Next js",
      "Node.js",
      "MySQL"
    ]
  });
  const [loading, setLoading] = useState(false);
  const dropRef = useRef();

  const extractTextFromPDF = async (pdfFile) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const typedArray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => item.str).join(' ');
            text += `${pageText}\n\n`;
          }

          resolve(text);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(pdfFile);
    });
  };

  const handleFile = (selected) => {
    if (selected?.type === 'application/pdf') {
      setFile(selected);
      setModifiedText('');
    } else {
      alert('Please upload a valid PDF file.');
      setFile(null);
    }
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current.classList.remove('drag-over');
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current.classList.remove('drag-over');
  };

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setModifiedText(null);

    try {
      const text = await extractTextFromPDF(file);

      const res = await axios.post('http://localhost:3000/api/clean-text', { text }, {
        headers: { "Content-Type": "application/json" },
      });

      setModifiedText(res.data.cleanedResume || 'No modified text received.');
    } catch (err) {
      console.error(err);
      alert('Error processing PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    generateResumePDF(modifiedText);
  };

  return (
    <div style={styles.container}>
      <h2>Resume Processor</h2>

      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={styles.dropZone}
      >
        <p>Drag and drop a PDF here or click to upload</p>
        <input type="file" accept="application/pdf" onChange={handleFileChange} style={styles.hiddenInput} />
      </div>

      {file && <p style={{ marginTop: '10px' }}>📄 Selected: {file.name}</p>}

      <button style={styles.button} onClick={handleProcess} disabled={loading || !file}>
        {loading ? 'Processing...' : 'Process Resume'}
      </button>

      {modifiedText && (
        <button style={{ ...styles.button, backgroundColor: '#28a745' }} onClick={handleDownload}>
          Download Modified PDF
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '500px',
    margin: 'auto',
    padding: '20px',
    textAlign: 'center',
    border: '1px solid #ddd',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
    background: '#f9f9f9',
    fontFamily: 'Arial, sans-serif',
  },
  dropZone: {
    border: '2px dashed #bbb',
    padding: '30px',
    cursor: 'pointer',
    borderRadius: '8px',
    backgroundColor: '#fff',
    position: "relative",
    transition: 'background-color 0.3s ease',
  },
  hiddenInput: {
    opacity: 0,
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
    cursor: 'pointer',
  },
  button: {
    marginTop: '20px',
    marginRight: '10px',
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '5px',
    border: 'none',
    color: '#fff',
    backgroundColor: '#007bff',
    cursor: 'pointer',
  },
};

export default ResumeUploader;
