import "/src/components/style.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AnswerKey = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { answerKeyId } = location.state || {};

  // Basic info fields
  const [reference, setReference] = useState("");
  const [studentName, setStudentName] = useState("");
  const [section, setSection] = useState("");
  const [date, setDate] = useState("");

  // Number of questions + answers array
  const [numQuestions, setNumQuestions] = useState(1);
  const [answers, setAnswers] = useState(Array(1).fill(""));

  // State for exam code and modal
  const [examCode, setExamCode] = useState("");
  const [showExamModal, setShowExamModal] = useState(false);
  const [isEditingExamCode, setIsEditingExamCode] = useState(false);

  // New state to toggle the details (instructions & basic fields)
  const [showDetails, setShowDetails] = useState(true);

  // Load existing data if editing
  useEffect(() => {
    if (!answerKeyId) return;

    async function loadAnswerKey() {
      const { data, error } = await supabase
        .from("answer_keys")
        .select("*")
        .eq("id", answerKeyId)
        .single();

      if (error) {
        console.error("Error loading key:", error);
        return;
      }

      setReference(data.reference || "");
      setStudentName(data.student_name || "");
      setSection(data.section || "");
      setDate(data.date || "");
      setNumQuestions(data.num_questions || 10);

      const loadedAnswers = data.answers ? JSON.parse(data.answers) : [];
      if (loadedAnswers.length) {
        setAnswers(loadedAnswers);
      }
      // Set exam code if available
      setExamCode(data.exam_code || "");
    }
    loadAnswerKey();
  }, [answerKeyId]);

  const handleNumQuestionsChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setNumQuestions(val);
      const newAnswers = [...answers];
      newAnswers.length = val;
      for (let i = 0; i < val; i++) {
        if (!newAnswers[i]) newAnswers[i] = "";
      }
      setAnswers(newAnswers);
    }
  };

  const handleSelectAnswer = (index, choice) => {
    const newAnswers = [...answers];
    newAnswers[index] = choice;
    setAnswers(newAnswers);
  };

  // Check for unanswered questions and exam code, then submit to Supabase
  const submitExamKey = async () => {
    // Validate that every question has an answer
    const unanswered = answers.some((answer) => answer === "");
    if (unanswered) {
      alert("Please select an answer for every question before saving.");
      return;
    }
    if (!examCode) {
      alert("Exam code is required.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in to save data.");
      return;
    }

    const payload = {
      user_id: user.id,
      reference,
      student_name: studentName,
      section,
      date,
      num_questions: numQuestions,
      answers: JSON.stringify(answers),
      exam_code: examCode,
    };

    let dbError;
    if (answerKeyId) {
      const { error } = await supabase
        .from("answer_keys")
        .update(payload)
        .eq("id", answerKeyId);
      dbError = error;
    } else {
      const { error } = await supabase.from("answer_keys").insert(payload);
      dbError = error;
    }

    if (dbError) {
      console.error("Error saving:", dbError);
      alert("Error saving answer key: " + dbError.message);
      return;
    }

    setShowExamModal(false);
    setIsEditingExamCode(false);
    navigate("/answerSheet");
  };

  // Open modal when save is clicked
  const handleSave = () => {
    setShowExamModal(true);
  };

  return (
    <div className="dashboard-container">
      <header>
        <h1>ANSWER KEY</h1>
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

          <Link to="/answerKey" className="active">
            <div className="icon">
              <img src="/src/img/AnswerKeys.png" alt="Answer Key" />
            </div>
            <p>Answer Key</p>
          </Link>

          <Link to="/answerSheet">
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
      <div className="main-content">
        <div className="scantron-form">
          {/* Toggle Button for Details as an Icon Button */}
          <div
            className="toggle-details"
            style={{ textAlign: "right", marginBottom: "10px" }}
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                fontSize: "0.8rem",
                padding: "5px 10px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showDetails ? "Display Questions Only" : "Show Details"}
            </button>
          </div>

          {/* Details Section: Instructions, Reference, Name, Section, Date */}
          {showDetails && (
            <>
              {/* Instructions */}
              <ul className="instructions">
                <li>Do not fold or crush this answer sheet.</li>
                <li>Use black pen or blue pen only.</li>
                <li>Avoid any stray mark on the answer sheet.</li>
                <li>Do not use marker or correction fluid to hide any marks.</li>
              </ul>

              {/* Basic Fields */}
              <div className="form-row">
                <label>Reference:</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label>Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Joseph Cabral"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label>Section:</label>
                <input
                  type="text"
                  placeholder="e.g. CS601"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label>Date:</label>
                <input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Always Visible: Number of Questions */}
          <div className="form-row">
            <label>Number of Questions:</label>
            <input
              type="number"
              min="1"
              value={numQuestions}
              onChange={handleNumQuestionsChange}
            />
          </div>

          {/* Questions */}
          <h3>Questions</h3>
          {answers.map((ans, i) => (
            <div className="answer-row" key={i}>
              <span>Q{i + 1}:</span>
              <div className="options">
                {["A", "B", "C", "D"].map((choice) => (
                  <div
                    key={choice}
                    className={`option ${ans === choice ? "selected" : ""}`}
                    onClick={() => handleSelectAnswer(i, choice)}
                  >
                    {choice}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={handleSave}>Save to Answer Sheet</button>
        </div>
      </div>

      {/* Centered Modal Popup for Exam Code */}
      {showExamModal && (
        <div className="modal-overlay">
          <div className="modal">
            {answerKeyId && !isEditingExamCode ? (
              <>
                <h2>Exam Code</h2>
                <p>
                  Current exam code: <strong>{examCode}</strong>
                </p>
                <p>
                  Would you like to use the same exam code or edit it?
                </p>
                <div className="modal-buttons">
                  <button onClick={submitExamKey}>Use Same</button>
                  <button onClick={() => setIsEditingExamCode(true)}>
                    Edit Exam Code
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>{answerKeyId ? "Edit Exam Code" : "Enter Exam Code"}</h2>
                <input
                  type="text"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  placeholder="Enter exam code"
                />
                <div className="modal-buttons">
                  <button onClick={submitExamKey}>Save</button>
                </div>
              </>
            )}
            <button
              className="modal-close"
              onClick={() => {
                setShowExamModal(false);
                setIsEditingExamCode(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerKey;
