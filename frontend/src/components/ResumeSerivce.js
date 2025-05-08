import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.vfs;

export const generateResumePDF = (resumeData) => {
    const { name, email, phone, linkedIn, github, address, website, summary, experience, education, skills } = resumeData;
    const splitSkillsIntoColumns = (skills = []) => {
        const half = Math.ceil(skills.length / 2);
        return [skills.slice(0, half), skills.slice(half)];
    };

    const [leftSkills, rightSkills] = splitSkillsIntoColumns(skills);
    const docDefinition = {
        content: [
            { text: name, style: "header" },
            { text: `${email} | ${phone} | ${linkedIn} | ${github}`, style: "subheader" },
            { text: website ? `Website: ${website}` : "", margin: [0, 0, 0, 10] },
            { text: address, style: "small" },

            { text: "Professional Summary", style: "sectionHeader" },
            { text: summary, margin: [0, 0, 0, 10] },

            { text: "Experience", style: "sectionHeader" },
            ...experience?.map((exp) => [
                { text: `${exp.role} - ${exp.company}`, style: "jobTitle" },
                { text: exp.dates, style: "small" },
                { text: exp.description, margin: [0, 0, 0, 5] },
                exp.technologies.length > 0
                    ? { text: "Technologies: " + exp.technologies.join(", "), italics: true, margin: [0, 0, 0, 10] }
                    : {}
            ]).flat(),

            { text: "Education", style: "sectionHeader" },
            ...education?.map((edu) => [
                { text: `${edu.degree} - ${edu.institution}`, style: "jobTitle" },
                { text: edu.dates, style: "small", margin: [0, 0, 0, 10] }
            ]).flat(),

            {
                text: "Skills",
                style: "sectionHeader"
            },
            {
                columns: [
                    { ul: leftSkills },
                    { ul: rightSkills }
                ],
                margin: [0, 0, 0, 10]
            }
        ],
        styles: {
            header: { fontSize: 20, bold: true },
            subheader: { fontSize: 12, italics: true, margin: [0, 0, 0, 5] },
            sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], decoration: "underline" },
            jobTitle: { bold: true, fontSize: 12 },
            small: { fontSize: 10, color: "gray" }
        }
    };

    pdfMake.createPdf(docDefinition).download(`${name}_resume.pdf`);
};
