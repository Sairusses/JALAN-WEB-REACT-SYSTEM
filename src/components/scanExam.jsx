import "/src/components/style.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const ScanExam = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const testerMode = location.state?.testerMode;

  // Retrieve exam details passed from AnswerSheet, including extra details
  const examDetails = location.state?.examDetails || {};
  const { maxScore, examCode, reference, yearLevel, course: examCourse, section: examSection, subject, examType } = examDetails;

  // Validate exam details
  useEffect(() => {
    if (!yearLevel || !examCourse || !examSection) {
      alert("Exam details are incomplete. Please re-enter exam details.");
      navigate("/answerSheet");
    }
  }, [yearLevel, examCourse, examSection, navigate]);

  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [score, setScore] = useState("");
  const [scoreError, setScoreError] = useState("");
  const [scanResult, setScanResult] = useState(null);

  // Fetch students matching the query and exam details
  useEffect(() => {
    const fetchStudents = async () => {
      if (!studentQuery) {
        setStudentResults([]);
        return;
      }
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("year_level", yearLevel)
        .eq("course", examCourse)
        .eq("section", examSection)
        .ilike("username", `%${studentQuery}%`);
      if (error) {
        console.error("Error fetching students:", error);
      } else {
        setStudentResults(data);
      }
    };
    fetchStudents();
  }, [studentQuery, yearLevel, examCourse, examSection]);

  const handleScoreChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setScore(value);
      if (maxScore && value !== "" && Number(value) > maxScore) {
        setScoreError(`Score cannot exceed ${maxScore}`);
      } else {
        setScoreError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (maxScore && Number(score) > maxScore) {
      setScoreError(`Score cannot exceed ${maxScore}`);
      return;
    }
    if (!selectedStudent) {
      alert("Please select a student.");
      return;
    }
    if (!score) {
      alert("Please enter a score.");
      return;
    }

    // Retrieve logged-in teacher's user id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Not logged in!");
      return;
    }
    const teacherId = user.id;

    // Use course and section from selected student if available; otherwise fallback
    const course = selectedStudent.course || examCourse || "N/A";
    const section = selectedStudent.section || examSection || "N/A";

    // Prepare exam data record
    const examData = {
      teacher_id: teacherId,
      student_id: selectedStudent.id, // This must match the student's auth id!
      course,
      section,
      subject,
      exam_type: examType,
      score: Number(score),
      term: examDetails.term || "1st Term",
      year_level: yearLevel, // Ignored on insert because grade_reports doesn't have this column (joined from students instead)
    };

    // Upsert exam record (ensure unique constraint exists on student_id, exam_type, subject, term, course, section)
    const { error } = await supabase
      .from("grade_report")
      .upsert(examData, { onConflict: ["student_id", "exam_type", "subject", "term", "course", "section"] });
    if (error) {
      console.error("Error saving exam data:", error);
      alert("Failed to save exam data: " + error.message);
    } else {
      alert("Exam data saved successfully!");
      const checkAnother = window.confirm("Do you want to check another student?");
      if (checkAnother) {
        setSelectedStudent(null);
        setStudentQuery("");
        setStudentResults([]);
        setScore("");
        setScoreError("");
      } else {
        navigate("/gradeReport", { state: { testerExamData: examData } });
      }
    }
  };

  return (
    <div className="dashboard-container" style={{ fontSize: "18px", lineHeight: "1.5", padding: "20px" }}>
      {/* TOP NAVBAR (green, consistent with other pages) */}
      <nav
        className="top-navbar"
        style={{
          width: "100%",
          height: "64px",
          background: "#54b948", // Green
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100,
          boxShadow: "0 2px 8px #0001",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link to="/home">
            <img src="/src/img/house.png" alt="Back" style={{ width: "32px", marginRight: "12px", cursor: "pointer" }} />
          </Link>
          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "22px", letterSpacing: "1px" }}>
            SCAN EXAM
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link to="/scanExam" className="active" style={{ color: "#fff", textDecoration: "underline", fontWeight: 700 }}>
            <img src="/src/img/ExamScan.png" alt="Scan Exam" style={{ width: "28px", verticalAlign: "middle", marginRight: "6px" }} />
            Scan Exam
          </Link>
          <Link to="/answerKey" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>
            <img src="/src/img/AnswerKeys.png" alt="Answer Key" style={{ width: "28px", verticalAlign: "middle", marginRight: "6px" }} />
            Answer Key
          </Link>
          <Link to="/answerSheet" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>
            <img src="/src/img/Sheet.png" alt="Answer Sheet" style={{ width: "28px", verticalAlign: "middle", marginRight: "6px" }} />
            Answer Sheet
          </Link>
          <Link to="/gradeReport" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>
            <img src="/src/img/ReportGrade.png" alt="Grade Report" style={{ width: "28px", verticalAlign: "middle", marginRight: "6px" }} />
            Grade Report
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ marginTop: "84px" }}>
        <header style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>SCAN EXAM</h1>
          {testerMode && (
            <>
              <p style={{ color: "#444", marginBottom: "5px" }}>
                Scantron machine is not yet available.
              </p>
              {maxScore && (
                <p style={{ color: "#444", marginBottom: "5px" }}>
                  Exam is out of {maxScore}
                </p>
              )}
              <p style={{ color: "#444" }}>Please enter the exam details below.</p>
            </>
          )}
        </header>

        {testerMode && (
          <div
            style={{
              backgroundColor: "#f7f7f7",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "500px",
              margin: "0 auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "20px", fontWeight: "bold" }}>Student:</label>
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Search student by name"
                  style={{
                    fontSize: "18px",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    width: "100%",
                    marginTop: "5px",
                  }}
                />
              </div>
              {studentResults.length > 0 && (
                <div style={{ marginBottom: "15px" }}>
                  <p style={{ fontSize: "16px", marginBottom: "5px" }}>Select a student:</p>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {studentResults.map((student) => (
                      <li
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          setStudentResults([]);
                          setStudentQuery(student.username);
                        }}
                        style={{
                          fontSize: "18px",
                          padding: "8px",
                          backgroundColor: "#eaeaea",
                          borderRadius: "4px",
                          marginBottom: "5px",
                          cursor: "pointer",
                        }}
                      >
                        {student.username} ({student.email})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedStudent && (
                <div style={{ marginBottom: "15px", fontSize: "18px" }}>
                  <strong>Selected Student:</strong> {selectedStudent.username} <br />
                  <span>
                    Course: {selectedStudent.course || examCourse || "N/A"} | Section: {selectedStudent.section || examSection || "N/A"}
                  </span>
                </div>
              )}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "20px", fontWeight: "bold" }}>
                  Score {maxScore ? `(out of ${maxScore})` : ""}:
                </label>
                <input
                  type="text"
                  value={score}
                  onChange={handleScoreChange}
                  placeholder="Enter score"
                  style={{
                    fontSize: "18px",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    width: "100%",
                    marginTop: "5px",
                  }}
                />
                {scoreError && (
                  <p style={{ color: "red", fontSize: "16px", marginTop: "5px" }}>{scoreError}</p>
                )}
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: "#4CAF50",
                  color: "#fff",
                  fontSize: "20px",
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                disabled={scoreError || score === "" || !selectedStudent}
              >
                Submit Exam Score
              </button>
            </form>
          </div>
        )}

        {scanResult && (
          <div
            style={{
              backgroundColor: "#f7f7f7",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "500px",
              margin: "20px auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h2>Scan Result</h2>
            <p>{scanResult}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanExam;
