import "/src/components/style.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; 

const AnswerSheet = () => {
  const navigate = useNavigate();
  const [answerKeys, setAnswerKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state for exam details
  const [showModal, setShowModal] = useState(false);
  const [currentAnswerKey, setCurrentAnswerKey] = useState(null);
  
  // Updated exam details state to include "term"
  const [examDetailsForm, setExamDetailsForm] = useState({
    yearLevel: "",
    term: "",
    course: "",
    section: "",
    subject: "",
    examType: "",
  });

  // Dropdown options
  const yearLevelOptions = ["1st year", "2nd year", "3rd year", "4th year"];
  
  // New term options array
  const termOptions = ["1st Term", "2nd Term"];

  const courseOptions = [
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
  const sectionOptions = ["Section 1", "Section 2", "Section 3", "Section 4", "Section 5", "Section 6", "Section 7", "Section 8", "Section 9", "Section 10"];
  const subjectOptions = [
    "Subject 1",
    "Subject 2",
    "Subject 3",
    "Subject 4",
    "Subject 5",
    "Subject 6",
    "Subject 7",
    "Subject 8",
    "Subject 9",
    "Subject 10",
    "Subject 11",
    "Subject 12",
    "Subject 13",
    "Subject 14",
    "Subject 15",
  ];
  const examTypeOptions = ["Prelim", "Midterm", "Pre-Final", "Final"];

  // Fetch answer keys for the current user
  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Not logged in or error:", userError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("answer_keys")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setAnswerKeys(data || []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleEdit = (id) => {
    navigate("/answerKey", { state: { answerKeyId: id } });
  };

  // Show modal when teacher clicks "Start Checking"
  const handleStartChecking = (key) => {
    setCurrentAnswerKey(key);
    setShowModal(true);
  };

  const handleExamDetailsChange = (e) =>
    setExamDetailsForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleExamDetailsSubmit = (e) => {
    e.preventDefault();
    // Simple validation: ensure all fields are filled
    const { yearLevel, term, course, section, subject, examType } = examDetailsForm;
    if (!yearLevel || !term || !course || !section || !subject || !examType) {
      alert("Please fill in all exam details.");
      return;
    }
    // Determine maxScore from answer key
    let maxScore = 0;
    try {
      const answersArr = JSON.parse(currentAnswerKey.answers);
      if (Array.isArray(answersArr)) {
        maxScore = answersArr.length;
      }
    } catch (err) {
      console.error("Error parsing answers:", err);
    }
    // Bundle exam details (including term) and navigate to scanExam
    navigate("/scanExam", { 
      state: { 
        testerMode: true,
        examDetails: {
          examCode: currentAnswerKey.exam_code,
          maxScore,
          reference: currentAnswerKey.reference,
          ...examDetailsForm,
        },
      },
    });
  };

  // Delete an answer key record
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this answer key?")) {
      const { error } = await supabase
        .from("answer_keys")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Error deleting answer key", error);
        alert("Error deleting answer key: " + error.message);
      } else {
        setAnswerKeys(answerKeys.filter((key) => key.id !== id));
      }
    }
  };

  // Helper function to format the answer key from a JSON string
  const formatAnswerKey = (answers) => {
    try {
      const parsed = JSON.parse(answers);
      if (Array.isArray(parsed)) {
        return parsed.join(", ");
      }
      return answers;
    } catch (err) {
      return answers;
    }
  };

  // Filter answer keys based on exam_code field
  const filteredKeys = answerKeys.filter((key) =>
    key.exam_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <header>
        <h1>ANSWER SHEET</h1>
      </header>

      {/* BACK LINK */}
      <Link to="/home">
        <div className="back-container">
          <img src="/src/img/back.png" alt="back" className="back" />
        </div>
      </Link>

      {/* SIDE NAVBAR */}
      <div className="side-navbar">
        <div className="dashboard-item">
          <Link to="/scanExam">
            <div className="icon">
              <img src="/src/img/ExamScan.png" alt="Scan Exam" />
            </div>
            <p>Scan exam</p>
          </Link>

          <Link to="/answerKey">
            <div className="icon">
              <img src="/src/img/AnswerKeys.png" alt="Answer Key" />
            </div>
            <p>Answer Key</p>
          </Link>

          <Link to="/answerSheet" className="active">
            <div className="icon">
              <img src="/src/img/Sheet.png" alt="Answer Sheet" />
            </div>
            <p>Answer Sheet</p>
          </Link>

          <Link to="/gradeReport">
            <div className="icon">
              <img src="/src/img/ReportGrade.png" alt="Grade Report" />
            </div>
            <p>Grade Report</p>
          </Link>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div 
        className="main-content" 
        style={{ marginLeft: "25px", padding: "20px" }}
      >
        <div className="search-bar" style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search by exam code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredKeys.length === 0 ? (
          <p>No answer keys found for your account.</p>
        ) : (
          filteredKeys.map((key) => (
            <div key={key.id} className="answer-key-item">
              <h2>Exam Code: {key.exam_code}</h2>
              <p>Answer Key: {formatAnswerKey(key.answers)}</p>
              <button onClick={() => handleEdit(key.id)}>Edit</button>
              <button onClick={() => handleDelete(key.id)}>Delete</button>
              <button onClick={() => handleStartChecking(key)}>Start Checking</button>
            </div>
          ))
        )}
      </div>

      {/* Modal Pop-Up for Exam Details */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            width: "90%",
            maxWidth: "500px",
          }}>
            <h2>Enter Exam Details</h2>
            <form onSubmit={handleExamDetailsSubmit}>
              <div style={{ marginBottom: "10px" }}>
                <label>Year Level:</label>
                <select name="yearLevel" value={examDetailsForm.yearLevel} onChange={handleExamDetailsChange} required>
                  <option value="">Select Year Level</option>
                  {yearLevelOptions.map((lvl, i) => <option key={i} value={lvl}>{lvl}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Term:</label>
                <select name="term" value={examDetailsForm.term} onChange={handleExamDetailsChange} required>
                  <option value="">Select Term</option>
                  {termOptions.map((term, i) => <option key={i} value={term}>{term}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Course:</label>
                <select name="course" value={examDetailsForm.course} onChange={handleExamDetailsChange} required>
                  <option value="">Select Course</option>
                  {courseOptions.map((course, i) => <option key={i} value={course}>{course}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Section:</label>
                <select name="section" value={examDetailsForm.section} onChange={handleExamDetailsChange} required>
                  <option value="">Select Section</option>
                  {sectionOptions.map((sec, i) => <option key={i} value={sec}>{sec}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Subject:</label>
                <select name="subject" value={examDetailsForm.subject} onChange={handleExamDetailsChange} required>
                  <option value="">Select Subject</option>
                  {subjectOptions.map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Exam Type:</label>
                <select name="examType" value={examDetailsForm.examType} onChange={handleExamDetailsChange} required>
                  <option value="">Select Exam Type</option>
                  {examTypeOptions.map((type, i) => <option key={i} value={type}>{type}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit">Proceed to Scan Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerSheet;
