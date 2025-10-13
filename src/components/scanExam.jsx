import "/src/components/style.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import Webcam from "react-webcam";

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
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const webcamRef = useRef(null);

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

    console.log("Selected student ID:", selectedStudent.id);

    // Upsert exam record (ensure unique constraint exists on student_id, exam_type, subject, term, course, section)
    const { error } = await supabase
      .from("grade_reports")
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

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    processBubbleSheet(imageSrc);
  };

  const processBubbleSheet = async (image) => {
    setIsScanning(true);
    try {
      // Simulate sending the image to a server or processing it locally
      console.log("Processing bubble sheet...");
      // Replace this with actual API call or image processing logic
      const result = await fakeBubbleSheetRecognition(image);
      setScanResult(result);
    } catch (error) {
      console.error("Error processing bubble sheet:", error);
      alert("Failed to process bubble sheet.");
    } finally {
      setIsScanning(false);
    }
  };

  const fakeBubbleSheetRecognition = async (image) => {
    // Simulate a delay for processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Sample Result: Student ID 12345, Score: 85");
      }, 2000);
    });
  };

  return (
    <div className="dashboard-container" style={{ fontSize: "18px", lineHeight: "1.5", padding: "20px" }}>
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

      <Link to="/home">
        <div className="back-container" style={{ marginBottom: "20px" }}>
          <img src="/src/img/back.png" alt="Back" style={{ width: "40px" }} />
        </div>
      </Link>

      <div className="side-navbar" style={{ marginBottom: "20px" }}>
        <div className="dashboard-item">
          <Link to="/scanExam" className="active">
            <div className="icon">
              <img src="/src/img/ExamScan.png" alt="Scan Exam" style={{ width: "40px" }} />
            </div>
            <p>Scan Exam</p>
          </Link>
          <Link to="/answerKey">
            <div className="icon">
              <img src="/src/img/AnswerKeys.png" alt="Answer Key" style={{ width: "40px" }} />
            </div>
            <p>Answer Key</p>
          </Link>
          <Link to="/answerSheet">
            <div className="icon">
              <img src="/src/img/Sheet.png" alt="Answer Sheet" style={{ width: "40px" }} />
            </div>
            <p>Answer Sheet</p>
          </Link>
          <Link to="/gradeReport">
            <div className="icon">
              <img src="/src/img/ReportGrade.png" alt="Grade Report" style={{ width: "40px" }} />
            </div>
            <p>Grade Report</p>
          </Link>
        </div>
      </div>

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

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        />
        <button
          onClick={captureImage}
          style={{
            marginTop: "10px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            fontSize: "18px",
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          disabled={isScanning}
        >
          {isScanning ? "Scanning..." : "Capture and Scan"}
        </button>
      </div>

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
  );
};

export default ScanExam;
