import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const StudentGradeReport = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");

  const navigate = useNavigate();

  // Static dropdown options
  const years = ["1st year", "2nd year", "3rd year", "4th year"];
  const examTypes = ["Prelim", "Midterm", "Pre-Final", "Final"];
  const terms = ["1st Term", "2nd Term"];
  const courses = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Computer Engineering",
    "Bachelor of Science in Business Administration",
    "Bachelor of Science in Accountancy",
    "Bachelor of Science in Hospitality Management",
    "Bachelor of Arts in Communication",
    "Bachelor of Multimedia Arts",
    "Bachelor of Science in Tourism Managements",
  ];
  const subjects = Array.from({ length: 15 }, (_, i) => `Subject ${i + 1}`);
  const sections = Array.from({ length: 15 }, (_, i) => `Section ${i + 1}`);

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
          .from("grade_reports")
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

  const filteredGrades = grades.filter((g) => {
    return (
      (selectedYear === "" || g.student?.year_level === selectedYear) &&
      (selectedTerm === "" || g.term === selectedTerm) &&
      (selectedCourse === "" || g.course === selectedCourse) &&
      (selectedSubject === "" || g.subject === selectedSubject) &&
      (selectedSection === "" || g.section === selectedSection) &&
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

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Back Button */}
      <div
        className="back-container"
        onClick={() => navigate(-1)}
        style={{
          cursor: "pointer",
          position: "absolute",
          top: "20px",
          left: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <img src="/src/img/back.png" alt="Back" style={{ width: "24px", height: "24px" }} />
        <span style={{ fontSize: "16px", color: "#4CAF50", fontWeight: "bold" }}>Back</span>
      </div>

      {/* Side Navbar */}
      <div className="side-navbar">
        <div className="dashboard-item">
          <Link to="/st-gradeReport" className="active">
            <div className="icon">
              <img src="/src/img/ReportGrade.png" alt="Grade Report" />
            </div>
            <p>My Grades</p>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="dashboard-container"
        style={{
          marginLeft: "0", // Remove fixed margin for side navbar
          maxWidth: "100%", // Use full width
          marginTop: "50px",
          padding: "20px", // Reduce padding for smaller screens
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
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
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
            <option value="">All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
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
            <option value="">All Sections</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Grade Cards */}
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
  );
};

export default StudentGradeReport;
