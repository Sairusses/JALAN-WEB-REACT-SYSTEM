import "/src/components/style.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { FaCopy, FaEdit, FaTrash, FaCheckCircle } from "react-icons/fa";
import TeacherNavbar from "./teacher-navbar.jsx";

const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const terms = ["1st Term", "2nd Term"];

const AnswerSheet = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [answerKeys, setAnswerKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentAnswerKey, setCurrentAnswerKey] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [examDetailsForm, setExamDetailsForm] = useState({
    yearLevel: "",
    term: "",
    course: "",
    section: "",
    subject: "",
    examType: "",
  });

  const [courseOptions, setCourseOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const examTypeOptions = ["Prelim", "Midterm", "Pre-Final", "Final"];

  useEffect(() => {
    async function fetchOptions() {
      const { data: courses } = await supabase.from("courses").select("*");
      setCourseOptions(courses || []);
    }
    fetchOptions();
  }, []);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("answer_keys")
        .select("*")
        .eq("user_id", user.id);

      if (!error) setAnswerKeys(data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const navigateWithState = (path, state = {}) => {
    navigate(path, { state });
  };

  const handleEdit = (id) => {
    navigateWithState("/answerKey", { answerKeyId: id });
    window.location.reload();
  };

  const handleStartChecking = async (key) => {
    setCurrentAnswerKey(key);

    try {
      // Fetch the record from Supabase to check if details exist
      const { data, error } = await supabase
        .from("answer_keys")
        .select("id, year_level, term, course, section, subject, exam_type, num_questions")
        .eq("id", key.id)
        .single();

      if (error) throw error;

      // Check if all required exam details exist
      const hasCompleteDetails =
        data.year_level &&
        data.term &&
        data.course &&
        data.section &&
        data.subject &&
        data.exam_type;

      if (hasCompleteDetails) {
        // Navigate directly to ScanExam, skipping modal
        navigate("/scanExam", {
          state: { id: data.id, maxScore: data.num_questions },
        });
        window.location.reload();
      } else {
        // Show modal for missing details
        setShowModal(true);
      }
    } catch (err) {
      console.error("Error fetching exam details:", err.message);
      alert("Failed to check exam details. Please try again.");
    }
  };

  const handleExamDetailsChange = (e) =>
    setExamDetailsForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleExamDetailsSubmit = async () => {
    const { yearLevel, term, course, section, subject, examType } = examDetailsForm;

    if (!yearLevel || !term || !course || !section || !subject || !examType) {
      alert("Please fill in all exam details.");
      return;
    }

    let maxScore = 0;
    try {
      const answersArr = JSON.parse(currentAnswerKey.answers);
      if (Array.isArray(answersArr)) {
        maxScore = answersArr.length;
      }
    } catch {
      // ignore parsing errors
    }

    try {
      // Update exam details in Supabase
      const { error } = await supabase
        .from("answer_keys")
        .update({
          year_level: yearLevel,
          term: term,
          course: course,
          section: section,
          subject: subject,
          exam_type: examType,
        })
        .eq("id", currentAnswerKey.id);

      if (error) alert(error.message.toString());

      // Navigate to ScanExam with only the ID and maxScore
      navigate("/scanExam", {
        state: {
          id: currentAnswerKey.id,
          maxScore,
        },
      });
      window.location.reload();
    } catch (err) {
      console.error("Error updating exam details:", err.message);
      alert("Failed to save exam details. Please try again.");
    }
  };

  // Delete confirmation modal
  const handleDelete = async (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const { error } = await supabase
      .from("answer_keys")
      .delete()
      .eq("id", deleteId);
    if (!error) {
      setAnswerKeys((prev) => prev.filter((key) => key.id !== deleteId));
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // Format answer key
  const formatAnswerKey = (answers) => {
    try {
      const parsed = JSON.parse(answers);
      if (Array.isArray(parsed)) {
        return parsed.join(", ");
      }
      return answers;
    } catch {
      return answers;
    }
  };

  // Copy answer key to clipboard
  const handleCopyAnswers = (answers) => {
    const answerString = formatAnswerKey(answers);
    navigator.clipboard.writeText(answerString);
    alert("Answer key copied to clipboard!");
  };

  const filteredKeys = answerKeys.filter((key) =>
    key.exam_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered courses based on yearLevel and term
  const filteredCourses = courseOptions.filter(
    (c) => c.year_level === examDetailsForm.yearLevel && (!c.term || c.term === examDetailsForm.term)
  );

  // When course changes, update subjects and sections
  useEffect(() => {
    const selectedCourse = filteredCourses.find((c) => c.course === examDetailsForm.course);
    let sections = [];
    let subjects = [];
    if (selectedCourse) {
      if (Array.isArray(selectedCourse.sections)) {
        sections = selectedCourse.sections;
      } else if (typeof selectedCourse.sections === "string") {
        try {
          sections = JSON.parse(selectedCourse.sections);
        } catch {
          sections = selectedCourse.sections.split(",").map((s) => s.trim());
        }
      }
      if (Array.isArray(selectedCourse.subjects)) {
        subjects = selectedCourse.subjects;
      } else if (typeof selectedCourse.subjects === "string") {
        try {
          subjects = JSON.parse(selectedCourse.subjects);
        } catch {
          subjects = selectedCourse.subjects.split(",").map((s) => s.trim());
        }
      }
    }
    sections = sections.filter((s, i, arr) => s && arr.indexOf(s) === i);
    subjects = subjects.filter((s, i, arr) => s && arr.indexOf(s) === i);

    setSectionOptions(sections);
    setSubjectOptions(subjects);
    // console logs helpful when debugging routes / data
    // console.log("Sections options:", sections);
    // console.log("Subjects options:", subjects);
  }, [examDetailsForm.course, filteredCourses]);

  // Close modals when location changes OR when component unmounts
  useEffect(() => {
    setShowModal(false);
    setShowDeleteModal(false);
    return () => {
      setShowModal(false);
      setShowDeleteModal(false);
    };
  }, [location.pathname]);

  return (
    <div className="dashboard-container">
      <TeacherNavbar activePage="Answer Sheet"/>/
      {/* MAIN CONTENT */}
      <div className="main-content" style={{ marginTop: "84px" }}>
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
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <div className="spinner" style={{
              width: "40px",
              height: "40px",
              border: "4px solid #eee",
              borderTop: "4px solid #1976d2",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "auto"
            }} />
            <p>Loading...</p>
          </div>
        ) : filteredKeys.length === 0 ? (
          <p>No answer keys found for your account.</p>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {filteredKeys.map((key) => {
              let numQuestions = 0;
              try {
                const arr = JSON.parse(key.answers);
                if (Array.isArray(arr)) numQuestions = arr.length;
              } catch { /* empty */ }
              return (
                <div key={key.id} className="answer-key-card" style={{
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 12px #0001",
                  padding: "20px",
                  position: "relative",
                  transition: "box-shadow 0.2s",
                  border: "1px solid #eee"
                }}>
                  <div style={{ position: "absolute", top: "18px", right: "18px" }}>
                    <span style={{
                      background: "#1976d2",
                      color: "#fff",
                      borderRadius: "20px",
                      padding: "4px 12px",
                      fontSize: "13px",
                      fontWeight: "bold"
                    }}>
                      {numQuestions} Questions
                    </span>
                  </div>
                  <h2 style={{ marginBottom: "8px" }}>
                    {key.exam_code}
                  </h2>
                  <div style={{ marginBottom: "8px", color: "#888" }}>
                    <span style={{ marginRight: "16px" }}>
                      <strong>Reference:</strong> {key.reference || "-"}
                    </span>
                    <span>
                      <strong>Date:</strong> {key.date || "-"}
                    </span>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Answer Key:</strong> <span style={{ color: "#1976d2" }}>{formatAnswerKey(key.answers)}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button
                      onClick={() => handleEdit(key.id)}
                      style={{
                        background: "#e3f2fd",
                        border: "none",
                        color: "#1976d2",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Edit Answer Key"
                    >
                      <FaEdit style={{ marginRight: "6px" }} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(key.id)}
                      style={{
                        background: "#ffebee",
                        border: "none",
                        color: "#c62828",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Delete Answer Key"
                    >
                      <FaTrash style={{ marginRight: "6px" }} /> Delete
                    </button>
                    <button
                      onClick={() => handleStartChecking(key)}
                      style={{
                        background: "#81c784",
                        border: "none",
                        color: "#fff",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Start Checking"
                    >
                      <FaCheckCircle style={{ marginRight: "6px" }} /> Start Checking
                    </button>
                    <button
                      onClick={() => handleCopyAnswers(key.answers)}
                      style={{
                        background: "#fffde7",
                        border: "none",
                        color: "#fbc02d",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Copy Answer Key"
                    >
                      <FaCopy style={{ marginRight: "6px" }} /> Copy Key
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
                  {yearLevels.map((lvl, i) => <option key={i} value={lvl}>{lvl}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Term:</label>
                <select name="term" value={examDetailsForm.term} onChange={handleExamDetailsChange} required>
                  <option value="">Select Term</option>
                  {terms.map((term, i) => <option key={i} value={term}>{term}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Course:</label>
                <select name="course" value={examDetailsForm.course} onChange={handleExamDetailsChange} required>
                  <option value="">Select Course</option>
                  {filteredCourses.flat().map((course, i) => (
                    <option key={i} value={course.course}>{course.course}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Section:</label>
                <select name="section" value={examDetailsForm.section} onChange={handleExamDetailsChange} required>
                  <option value="">Select Section</option>
                  {sectionOptions.flat().map((sec, i) => (
                    <option key={i} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Subject:</label>
                <select name="subject" value={examDetailsForm.subject} onChange={handleExamDetailsChange} required>
                  <option value="">Select Subject</option>
                  {subjectOptions.flat().map((sub, i) => (
                    <option key={i} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Exam Type:</label>
                <select name="examType" value={examDetailsForm.examType} onChange={handleExamDetailsChange} required>
                  <option value="">Select Exam Type</option>
                  {examTypeOptions.map((type, i) => (
                    <option key={i} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" onClick={handleExamDetailsSubmit}>Proceed to Scan Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
            padding: "24px",
            borderRadius: "10px",
            minWidth: "320px",
            textAlign: "center"
          }}>
            <h3>Delete Answer Key?</h3>
            <p>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "18px" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: "#e3f2fd",
                  border: "none",
                  color: "#1976d2",
                  borderRadius: "6px",
                  padding: "8px 18px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  background: "#ffebee",
                  border: "none",
                  color: "#c62828",
                  borderRadius: "6px",
                  padding: "8px 18px",
                  cursor: "pointer"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner animation CSS */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
          .answer-key-card:hover {
            box-shadow: 0 4px 24px #1976d233;
            border: 1px solid #1976d2;
          }
        `}
      </style>
    </div>
  );
};

export default AnswerSheet;
