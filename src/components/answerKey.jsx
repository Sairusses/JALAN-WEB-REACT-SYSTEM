import "/src/components/style.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { FaSave, FaTrash, FaCopy } from "react-icons/fa"; // Removed FaRandom

const AnswerKey = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { answerKeyId } = location.state || {};

  // Number of questions + answers array
  const [numQuestions, setNumQuestions] = useState(1);
  const [answers, setAnswers] = useState(Array(1).fill(""));

  // State for exam code and modal
  const [examCode, setExamCode] = useState("");
  const [showExamModal, setShowExamModal] = useState(false);
  const [isEditingExamCode, setIsEditingExamCode] = useState(false);

  // Progress bar
  const answeredCount = answers.filter((a) => a !== "").length;
  const progressPercent = Math.round((answeredCount / numQuestions) * 100);

  // New: number of choices (A-D or A-E)
  const [numChoices, setNumChoices] = useState(4);
  const choiceLetters = ["A", "B", "C", "D", "E"].slice(0, numChoices);

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

      setNumQuestions(data.num_questions || 0);

      const loadedAnswers = data.answers ? JSON.parse(data.answers) : [];
      if (loadedAnswers.length) {
        setAnswers(loadedAnswers);
      }
      setExamCode(data.exam_code || "");
    }
    loadAnswerKey();
  }, [answerKeyId]);

  const handleNumQuestionsChange = (e) => {
    const val = e.target.value;

    if (!isNaN(val) && val >= 0) {
      if (val > 75 || val < 0) {
        return; 
      }
      useState(setNumQuestions(val));
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

  const clearAllAnswers = () => {
    setAnswers(Array(numQuestions).fill(""));
  };

  // Check for unanswered questions and exam code, then submit to Supabase
  const submitExamKey = async () => {
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

  // Copy answer key to clipboard
  const handleCopyAnswers = () => {
    const answerString = answers.join(",");
    navigator.clipboard.writeText(answerString);
    alert("Answer key copied to clipboard!");
  };

  return (
    <div className="dashboard-container">
      {/* TOP NAVBAR with your requested green */}
      <nav
        className="top-navbar"
        style={{
          width: "100%",
          height: "64px",
          background: "#54b948", // Use this green for navbar
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
            ANSWER KEY
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link to="/scanExam" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>
            <img src="/src/img/ExamScan.png" alt="Scan Exam" style={{ width: "28px", verticalAlign: "middle", marginRight: "6px" }} />
            Scan Exam
          </Link>
          <Link to="/answerKey" className="active" style={{ color: "#fff", textDecoration: "underline", fontWeight: 700 }}>
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
      <div className="main-content" style={{ marginTop: "84px" }}>
        <div className="scantron-form">
          {/* Remove Display Questions Only button */}
          <div className="toggle-details" style={{ textAlign: "right", marginBottom: "10px" }}>
            <button
              onClick={clearAllAnswers}
              style={{
                fontSize: "0.8rem",
                padding: "5px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                background: "#ffebee",
                border: "none",
                color: "#c62828",
                display: "inline-flex",
                alignItems: "center"
              }}
              title="Clear all answers"
            >
              <FaTrash style={{ marginRight: "5px" }} /> Clear All
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontWeight: "bold" }}>Answered: {answeredCount}/{numQuestions}</label>
            <div style={{
              background: "#eee",
              borderRadius: "8px",
              height: "10px",
              width: "100%",
              marginTop: "5px",
              marginBottom: "5px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${progressPercent}%`,
                background: "#54b948", // Use this green for progress bar
                height: "100%",
                transition: "width 0.4s"
              }} />
            </div>
          </div>

          {/* Always Visible: Number of Questions */}
          <div className="form-row">
            <label>Number of Questions:</label>
            <input
              type="number"
              min="0"
              max="75"
              value={numQuestions}
              onChange={handleNumQuestionsChange}
            />
          </div>

          {/* New: Number of Choices */}
          <div className="form-row">
            <label>Choices per Question:</label>
            <select
              value={numChoices}
              onChange={e => {
                setNumChoices(Number(e.target.value));
                setAnswers(answers.map(ans => choiceLetters.includes(ans) ? ans : ""));
              }}
              style={{ marginLeft: "10px" }}
            >
              <option value={4}>A-D</option>
              <option value={5}>A-E</option>
            </select>
          </div>

          {/* Questions */}
          <h3>Questions</h3>
          {answers.map((ans, i) => (
            <div className="answer-row" key={i} style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
              background: "#f9f9f9",
              borderRadius: "8px",
              padding: "8px"
            }}>
              <span style={{ fontWeight: "bold", marginRight: "10px" }}>Q{i + 1}:</span>
              <div className="options" style={{ display: "flex", gap: "10px" }}>
                {choiceLetters.map((choice) => (
                  <div
                    key={choice}
                    className={`option ${ans === choice ? "selected" : ""}`}
                    onClick={() => handleSelectAnswer(i, choice)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: ans === choice ? "#54b948" : "#e0e0e0", // Use this green for selected
                      color: ans === choice ? "#fff" : "#333",
                      cursor: "pointer",
                      boxShadow: ans === choice ? "0 2px 8px #81c784" : "none",
                      transition: "all 0.2s",
                      border: ans === choice ? "2px solid #388e3c" : "2px solid transparent"
                    }}
                    title={`Choose ${choice} for Q${i + 1}`}
                  >
                    {choice}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* New: Action Buttons */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <button
              onClick={handleCopyAnswers}
              style={{
                background: "#e8f5e9", // Light green
                border: "1px solid #54b948",
                color: "#333",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
              title="Copy answer key to clipboard"
            >
              <FaCopy style={{ marginRight: "6px" }} /> Copy Key
            </button>
          </div>

          {/* New: Summary Table */}
          <div style={{ margin: "20px 0" }}>
            <h4>Answer Key Summary</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #eee", padding: "4px" }}>Answer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #eee", padding: "4px" }}>
                    {answers.join(", ")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Floating Save Button */}
          <button
            onClick={handleSave}
            style={{
              position: "fixed",
              bottom: "40px",
              right: "40px",
              background: "#54b948", // Use this green for save button
              color: "#fff",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              boxShadow: "0 4px 16px #54b948aa",
              border: "none",
              fontSize: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            title="Save Answer Key"
          >
            <FaSave />
          </button>
        </div>
      </div>

      {/* Centered Modal Popup for Exam Code */}
      {showExamModal && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          animation: "fadeIn 0.3s"
        }}>
          <div className="modal" style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "32px 24px",
            boxShadow: "0 8px 32px #0002",
            minWidth: "320px",
            animation: "slideUp 0.3s"
          }}>
            {answerKeyId && !isEditingExamCode ? (
              <>
                <h2 style={{ marginBottom: "10px" }}>Exam Code</h2>
                <p>
                  Current exam code: <strong>{examCode}</strong>
                </p>
                <p>
                  Would you like to use the same exam code or edit it?
                </p>
                <div className="modal-buttons" style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  <button onClick={submitExamKey} style={{ background: "#54b948", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>Use Same</button>
                  <button onClick={() => setIsEditingExamCode(true)} style={{ background: "#ffd54f", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>Edit Exam Code</button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: "10px" }}>{answerKeyId ? "Edit Exam Code" : "Enter Exam Code"}</h2>
                <input
                  type="text"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  placeholder="Enter exam code"
                  style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", width: "100%", marginBottom: "15px" }}
                />
                <div className="modal-buttons" style={{ display: "flex", gap: "10px" }}>
                  <button onClick={submitExamKey} style={{ background: "#54b948", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>Save</button>
                </div>
              </>
            )}
            <button
              className="modal-close"
              onClick={() => {
                setShowExamModal(false);
                setIsEditingExamCode(false);
              }}
              style={{ marginTop: "18px", background: "#e57373", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Add keyframes for fadeIn and slideUp in your CSS */}
    </div>
  );
};

export default AnswerKey;
