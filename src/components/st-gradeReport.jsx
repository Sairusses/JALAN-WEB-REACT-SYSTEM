import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const StudentGradeReport = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedTerm, setSelectedTerm] = useState("1st Term");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedSection, setSelectedSection] = useState("All Sections");
  const [selectedYear, setSelectedYear] = useState("1st year");
  const [selectedExamType, setSelectedExamType] = useState("");

  // Dynamic dropdown states
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);

  const navigate = useNavigate();

  // Static dropdown options
  const years = ["1st year", "2nd year", "3rd year", "4th year"];
  const examTypes = ["Prelim", "Midterm", "Pre-Final", "Final"];
  const terms = ["1st Term", "2nd Term"];

  // Fetch grades for the current student
  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        // Fetch the student record using the user's email
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("email", user.email)
          .single();

        if (studentError || !studentData) {
          throw new Error("Student record not found.");
        }
        // Fetch grades for the student
        const { data: gradesData, error: gradesError } = await supabase
          .from("grade_report")
          .select(`
            id,
            score,
            exam_type,
            term,
            course,
            section,
            subject,
            created_at,
            teacher:teachers(username),
            student:students(year_level)
          `)
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false });

        if (gradesError) throw gradesError;
        setGrades(gradesData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [navigate]);

  // Fetch all courses, subjects, and sections for dropdowns
  useEffect(() => {
    async function loadCourseData() {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("course, year_level, subjects, sections");
        if (error) throw error;

        // Extract unique courses
        const courseList = [...new Set(data.map((c) => c.course))];
        setCourses(courseList);

        // Extract unique subjects from all courses
        const subjectSet = new Set();
        data.forEach((c) => {
          let subjectsArr = [];
          if (Array.isArray(c.subjects)) {
            subjectsArr = c.subjects;
          } else if (typeof c.subjects === "string") {
            try {
              const parsed = JSON.parse(c.subjects);
              if (Array.isArray(parsed)) {
                subjectsArr = parsed;
              }
            } catch {}
          }
          subjectsArr.forEach((subj) => {
            if (typeof subj === "string") subjectSet.add(subj);
          });
        });
        setSubjects(Array.from(subjectSet));

        // Extract unique sections from all courses
        const sectionSet = new Set();
        data.forEach((c) => {
          let sectionsArr = [];
          if (Array.isArray(c.sections)) {
            sectionsArr = c.sections;
          } else if (typeof c.sections === "string") {
            try {
              const parsed = JSON.parse(c.sections);
              if (Array.isArray(parsed)) {
                sectionsArr = parsed;
              }
            } catch {}
          }
          sectionsArr.forEach((sec) => {
            if (typeof sec === "string") sectionSet.add(sec);
          });
        });
        setSections(Array.from(sectionSet));
      } catch (err) {
        setError("Failed to load course data");
      }
    }
    loadCourseData();
  }, []);

  const filteredGrades = grades.filter((g) => {
    return (
      (selectedYear === "" || g.student?.year_level === selectedYear) &&
      (selectedTerm === "" || g.term === selectedTerm) &&
      (selectedCourse === "All Courses" || g.course === selectedCourse) &&
      (selectedSubject === "All Subjects" || g.subject === selectedSubject) &&
      (selectedSection === "All Sections" || g.section === selectedSection) &&
      (selectedExamType === "" || g.exam_type === selectedExamType)
    );
  });

  // Group grades by subject key.
  const gradesBySubject = filteredGrades.reduce((acc, grade) => {
    const year = grade.student?.year_level || "Unknown Year";
    const groupingKey = selectedExamType
      ? `${grade.subject}-${grade.course}-${grade.term}-${grade.section}-${year}-${grade.exam_type}`
      : `${grade.subject}-${grade.course}-${grade.term}-${grade.section}-${year}`;

    if (!acc[groupingKey]) {
      acc[groupingKey] = {
        subject: grade.subject,
        course: grade.course,
        term: grade.term,
        section: grade.section,
        year: year,
        teacher: grade.teacher?.username || "Unknown",
        exams: {},
      };
    }
    acc[groupingKey].exams[grade.exam_type] = grade.score;
    return acc;
  }, {});

  // PDF download handler
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Determine which years/terms to show
    let yearsToShow =
      selectedYear && selectedYear !== "" ? [selectedYear] : ["1st year", "2nd year", "3rd year", "4th year"];
    let termsToShow =
      selectedTerm && selectedTerm !== "" ? [selectedTerm] : ["1st Term", "2nd Term"];

    yearsToShow.forEach((year, pageIdx) => {
      if (pageIdx > 0) doc.addPage();

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Jalan University", 105, 18, { align: "center" });
      doc.setFontSize(12);
      doc.setTextColor(76, 175, 80);
      doc.text("Official Student Report Card", 105, 26, { align: "center" });

      // Student Info
      doc.setFontSize(10.5);
      doc.setTextColor(44, 62, 80);
      doc.text(`Name: ${grades[0]?.student_name || "Student Name"}`, 20, 36);
      doc.text(`Course: ${grades[0]?.course || "Course"}`, 20, 42);
      doc.text(`Year Level: ${year}`, 120, 36);
      doc.text(`Section: ${grades[0]?.section || "Section"}`, 120, 42);

      let y = 52;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      Object.values(gradesBySubject)
        .filter(
          (subjectGrade) =>
            subjectGrade.year === year &&
            (termsToShow.includes(subjectGrade.term))
        )
        .forEach((subjectGrade) => {
          // Subject name and code formatting
          let subjectText = subjectGrade.subject || "-";
          let subjectName = subjectText;
          let subjectCode = "";
          if (subjectText.includes("(") && subjectText.includes(")")) {
            const match = subjectText.match(/^(.+?)\((.+?)\)$/);
            if (match) {
              subjectName = match[1].trim();
              subjectCode = match[2].trim();
            }
          }

          // Calculate font size based on length
          let fontSize = 10;
          if (subjectName.length > 32 || subjectCode.length > 12) fontSize = 8;
          if (subjectName.length > 48) fontSize = 7;

          // Draw top line for the block
          doc.setDrawColor(44, 62, 80);
          doc.setLineWidth(0.7);
          doc.line(15, y, 195, y);

          // Subject header row
          y += 7;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);

          // Wrap subject name and code if too long
          const subjectNameLines = doc.splitTextToSize(subjectName, 60);
          const subjectCodeLines = doc.splitTextToSize(subjectCode, 25);

          // Print subject name and code (multi-line if needed)
          let maxLines = Math.max(subjectNameLines.length, subjectCodeLines.length);
          for (let i = 0; i < maxLines; i++) {
            doc.text(subjectNameLines[i] || "", 17, y + i * 5);
            doc.text(subjectCodeLines[i] || "", 80, y + i * 5);
          }

          // Table header for exams (with more spacing between columns)
          doc.setFontSize(9);
          doc.text("Term", 105, y);
          doc.text("Exam", 125, y);
          doc.text("Score", 145, y);
          doc.text("Teacher", 165, y);

          // For each exam type, draw a row
          doc.setFont("helvetica", "normal");
          let examStartY = y + maxLines * 5;
          const examTypesToShow = selectedExamType
            ? [selectedExamType]
            : ["Prelim", "Midterm", "Pre-Final", "Final"];
          examTypesToShow.forEach((examType, idx) => {
            let rowFontSize = fontSize;
            doc.setFontSize(rowFontSize);

            doc.text(subjectGrade.term || "-", 105, examStartY + idx * 7);
            doc.text(examType, 125, examStartY + idx * 7);
            doc.text(
              subjectGrade.exams[examType]
                ? String(subjectGrade.exams[examType])
                : "-",
              145,
              examStartY + idx * 7,
              { align: "center" }
            );
            // Wrap teacher name if too long
            const teacherLines = doc.splitTextToSize(subjectGrade.teacher || "-", 35);
            doc.text(teacherLines[0], 165, examStartY + idx * 7);
          });

          // Draw bottom line for the block
          let blockHeight = maxLines * 5 + examTypesToShow.length * 7 + 2;
          doc.setDrawColor(44, 62, 80);
          doc.setLineWidth(0.7);
          doc.line(15, y + blockHeight, 195, y + blockHeight);

          // Add spacing between blocks
          y += blockHeight + 6;
          if (y > 230) {
            doc.addPage();
            y = 20;
          }
        });

      // Certification Section (on every page)
      y += 14;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11.5);
      doc.setTextColor(76, 175, 80);
      doc.text(
        "This is to certify that the grades listed above are correct and official.",
        20,
        y
      );
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(44, 62, 80);
      doc.text("Confirmed by:", 20, y);
      doc.line(55, y + 1, 120, y + 1);
      y += 10;
      doc.text("Professor's Signature", 60, y);

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Generated by Jalan Web React System", 105, 290, { align: "center" });
    });

    doc.save("grade-report.pdf");
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Top Navbar */}
      <nav
        style={{
          width: "100%",
          background: "linear-gradient(90deg, #4CAF50 60%, #388E3C 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img src="/src/img/ReportGrade.png" alt="Grade Report" style={{ width: "36px", height: "36px" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "22px", letterSpacing: "1px" }}>
            My Grades
          </span>
        </div>
        <div>
          <Link
            to="/st-gradeReport"
            style={{
              color: "#fff",
              fontWeight: 500,
              fontSize: "16px",
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: "6px",
              transition: "background 0.2s",
              background: "rgba(255,255,255,0.08)",
              marginRight: "8px",
            }}
            className="active"
          >
            Dashboard
          </Link>
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "#fff",
              color: "#388E3C",
              border: "none",
              borderRadius: "6px",
              padding: "8px 18px",
              fontWeight: 600,
              fontSize: "16px",
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              marginLeft: "8px",
            }}
          >
            Back
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div
        className="dashboard-container"
        style={{
          marginLeft: "0",
          maxWidth: "100%",
          marginTop: "84px", // <-- add margin for navbar height
          padding: "20px",
          backgroundColor: "#ffffff",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <header style={{ textAlign: "center", marginTop: "100px", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "36px", color: "#4CAF50", fontStyle: "italic", margin: "10px 0" }}>
            MY GRADE REPORT
          </h1>
        </header>

        {/* Download PDF Button */}
        <button
          onClick={handleDownloadPDF}
          style={{
            margin: "0 auto 20px auto",
            display: "block",
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "16px",
          }}
        >
          Download Grade Report as PDF
        </button>

        {/* Filters */}
        <div
          className="filters"
          style={{
            marginBottom: "20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          >
            <option value="">All Terms</option>
            {terms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          >
            <option value="All Courses">All Courses</option>
          </select>

          <select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          >
            <option value="">All Exam Types</option>
            {examTypes.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          >
            <option value="All Subjects">All Subjects</option>
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          >
            <option value="All Sections">All Sections</option>
          </select>
        </div>

        {/* Grade Cards */}
        <div id="grade-report-content">
          {loading ? (
            <p style={{ textAlign: "center" }}>Loading grades...</p>
          ) : error ? (
            <p style={{ textAlign: "center", color: "red" }}>Error: {error}</p>
          ) : filteredGrades.length === 0 ? (
            <p style={{ textAlign: "center" }}>No grades found for the selected filters.</p>
          ) : (
            <div
              className="grade-list"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {Object.values(gradesBySubject).map((subjectGrade) => (
                <div
                  key={`${subjectGrade.subject}-${subjectGrade.course}-${subjectGrade.term}-${subjectGrade.section}-${subjectGrade.year}`}
                  className="subject-grade"
                  style={{
                    background: "#f9f9f9",
                    padding: "20px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "24px",
                      color: "#4CAF50",
                      marginBottom: "10px",
                      textAlign: "center",
                    }}
                  >
                    {subjectGrade.subject}
                  </h3>
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#333",
                      marginBottom: "10px",
                      lineHeight: "1.5",
                    }}
                  >
                    <strong>Term:</strong> {subjectGrade.term} <br />
                    <strong>Year:</strong> {subjectGrade.year} <br />
                    <strong>Course:</strong> {subjectGrade.course} <br />
                    <strong>Section:</strong> {subjectGrade.section} <br />
                    <strong>Teacher:</strong> {subjectGrade.teacher}
                  </p>
                  <div
                    className="exam-scores"
                    style={{
                      display: "grid",
                      gridTemplateColumns: selectedExamType ? "1fr" : "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    {selectedExamType ? (
                      <div
                        className="score-item"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px",
                          backgroundColor: "#fff",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                          fontSize: "16px",
                        }}
                      >
                        <span style={{ fontWeight: "bold", color: "#4CAF50" }}>
                          {selectedExamType}:
                        </span>
                        <span>{subjectGrade.exams[selectedExamType] || "-"}</span>
                      </div>
                    ) : (
                      <>
                        <div
                          className="score-item"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "10px",
                            backgroundColor: "#fff",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            fontSize: "16px",
                          }}
                        >
                          <span style={{ fontWeight: "bold", color: "#4CAF50" }}>
                            Prelim:
                          </span>
                          <span>{subjectGrade.exams.Prelim || "-"}</span>
                        </div>
                        <div
                          className="score-item"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "10px",
                            backgroundColor: "#fff",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            fontSize: "16px",
                          }}
                        >
                          <span style={{ fontWeight: "bold", color: "#4CAF50" }}>
                            Midterm:
                          </span>
                          <span>{subjectGrade.exams.Midterm || "-"}</span>
                        </div>
                        <div
                          className="score-item"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "10px",
                            backgroundColor: "#fff",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            fontSize: "16px",
                          }}
                        >
                          <span style={{ fontWeight: "bold", color: "#4CAF50" }}>
                            Pre-Final:
                          </span>
                          <span>{subjectGrade.exams["Pre-Final"] || "-"}</span>
                        </div>
                        <div
                          className="score-item"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "10px",
                            backgroundColor: "#fff",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            fontSize: "16px",
                          }}
                        >
                          <span style={{ fontWeight: "bold", color: "#4CAF50" }}>
                            Final:
                          </span>
                          <span>{subjectGrade.exams.Final || "-"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentGradeReport;
