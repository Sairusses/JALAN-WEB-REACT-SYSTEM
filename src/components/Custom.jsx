import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";

const isTeacher = true;
const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const terms = ["1st Term", "2nd Term"];

const Custom = () => {
  const [step, setStep] = useState("course");
  const [batchCourses, setBatchCourses] = useState([]);
  const [showBatchReview, setShowBatchReview] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchSaveError, setBatchSaveError] = useState("");
  const [course, setCourse] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(0);
  const [subjects, setSubjects] = useState([[], []]);
  const [sections, setSections] = useState([[], []]);
  const [subjectInput, setSubjectInput] = useState("");
  const [sectionInput, setSectionInput] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [done, setDone] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchCourse, setSearchCourse] = useState("");
  const [editingSubjectIdx, setEditingSubjectIdx] = useState(null);
  const [editingSectionIdx, setEditingSectionIdx] = useState(null);
  const [editSubjectValue, setEditSubjectValue] = useState("");
  const [editSectionValue, setEditSectionValue] = useState("");
  const [reviewEdit, setReviewEdit] = useState({
    course: false,
    yearLevel: false,
    subjectIdx: [null, null],
    sectionIdx: [null, null],
    editCourseValue: "",
    editYearLevelValue: "",
    editSubjectValue: "",
    editSectionValue: "",
    editTerm: null,
  });
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const navigate = useNavigate();

  const fetchCourses = async () => {
    setCoursesLoading(true);
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setAllCourses(data || []);
    setCoursesLoading(false);
  };

  // Fetch all history
  const fetchHistory = async () => {
    const { data } = await supabase
      .from("course_history")
      .select("*")
      .order("changed_at", { ascending: false });
    setHistory(data || []);
  };

  useEffect(() => {
    if (isTeacher) {
      fetchCourses();
      fetchHistory();
    }
  }, []);

  // Course creation
  const handleCourseCreate = (e) => {
    e.preventDefault();
    if (course.trim()) setStep("term");
  };

  // Term selection
  const handleTermSelect = (idx) => {
    setSelectedTerm(idx);
    setStep("subjects");
  };

  // Add subject
  const handleAddSubject = () => {
    if (subjectInput.trim()) {
      const updated = [...subjects];
      updated[selectedTerm].push(subjectInput.trim());
      setSubjects(updated);
      setSubjectInput("");
    }
  };

  // Edit subject
  const handleEditSubject = (idx) => {
    setEditingSubjectIdx(idx);
    setEditSubjectValue(subjects[selectedTerm][idx]);
  };
  const handleSaveSubject = () => {
    const updated = [...subjects];
    updated[selectedTerm][editingSubjectIdx] = editSubjectValue;
    setSubjects(updated);
    setEditingSubjectIdx(null);
    setEditSubjectValue("");
  };
  const handleDeleteSubject = (idx) => {
    const updated = [...subjects];
    updated[selectedTerm].splice(idx, 1);
    setSubjects(updated);
  };

  // Done with subjects
  const handleDoneSubjects = () => setStep("sections");

  // Add section
  const handleAddSection = () => {
    if (sectionInput.trim()) {
      const updated = [...sections];
      updated[selectedTerm].push(sectionInput.trim());
      setSections(updated);
      setSectionInput("");
    }
  };

  // Edit section
  const handleEditSection = (idx) => {
    setEditingSectionIdx(idx);
    setEditSectionValue(sections[selectedTerm][idx]);
  };
  const handleSaveSection = () => {
    const updated = [...sections];
    updated[selectedTerm][editingSectionIdx] = editSectionValue;
    setSections(updated);
    setEditingSectionIdx(null);
    setEditSectionValue("");
  };
  const handleDeleteSection = (idx) => {
    const updated = [...sections];
    updated[selectedTerm].splice(idx, 1);
    setSections(updated);
  };

  // Done with sections
  const handleDoneSections = () => {
    if (selectedTerm === 0) {
      setSelectedTerm(1);
      setStep("subjects");
    } else {
      setStep("yearLevel");
    }
  };

  // Year level selection
  const handleYearLevelSelect = (e) => setYearLevel(e.target.value);

  // Go back to previous step
  const handleBack = () => {
    if (step === "term") {
      setStep("course");
    } else if (step === "subjects") {
      setStep("term");
    } else if (step === "sections") {
      setStep("subjects");
    } else if (step === "yearLevel") {
      setStep("sections");
    }
  };

  // Save all inputs to Supabase
  const handleDone = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const { data, error } = await supabase.from("courses").insert([
        {
          course,
          year_level: yearLevel || "1st Year",
          subjects: subjects,
          sections: sections,
        },
      ]).select();
      if (error) throw error;
      if (data && data[0]?.id) {
        await supabase.from("course_history").insert([
          {
            course_id: data[0].id,
            action: "created",
            details: {
              course,
              year_level: yearLevel || "1st Year",
              subjects,
              sections,
            },
            changed_by: "teacher",
          },
        ]);
        await fetchHistory();
      }
      await fetchCourses();
      setDone(true);
      setTimeout(() => {
        window.location.reload();
      }, 200); // Auto-refresh after 0.2 seconds
    } catch (err) {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // --- Review Modal Edit Handlers ---
  // Edit course name in review
  const handleReviewEditCourse = () => {
    setReviewEdit((prev) => ({
      ...prev,
      course: true,
      editCourseValue: course,
    }));
  };
  const handleReviewSaveCourse = () => {
    setCourse(reviewEdit.editCourseValue);
    setReviewEdit((prev) => ({ ...prev, course: false, editCourseValue: "" }));
  };

  // Edit year level in review
  const handleReviewEditYearLevel = () => {
    setReviewEdit((prev) => ({
      ...prev,
      yearLevel: true,
      editYearLevelValue: yearLevel,
    }));
  };
  const handleReviewSaveYearLevel = () => {
    setYearLevel(reviewEdit.editYearLevelValue);
    setReviewEdit((prev) => ({ ...prev, yearLevel: false, editYearLevelValue: "" }));
  };

  // Edit subject in review
  const handleReviewEditSubject = (termIdx, subjIdx) => {
    setReviewEdit((prev) => ({
      ...prev,
      subjectIdx: [termIdx === 0 ? subjIdx : null, termIdx === 1 ? subjIdx : null],
      editSubjectValue: subjects[termIdx][subjIdx],
      editTerm: termIdx,
    }));
  };
  const handleReviewSaveSubject = () => {
    const termIdx = reviewEdit.editTerm;
    const subjIdx = reviewEdit.subjectIdx[termIdx];
    const updated = [...subjects];
    updated[termIdx][subjIdx] = reviewEdit.editSubjectValue;
    setSubjects(updated);
    setReviewEdit((prev) => ({
      ...prev,
      subjectIdx: [null, null],
      editSubjectValue: "",
      editTerm: null,
    }));
  };
  const handleReviewDeleteSubject = (termIdx, subjIdx) => {
    const updated = [...subjects];
    updated[termIdx].splice(subjIdx, 1);
    setSubjects(updated);
    setReviewEdit((prev) => ({
      ...prev,
      subjectIdx: [null, null],
      editSubjectValue: "",
      editTerm: null,
    }));
  };

  // Edit section in review
  const handleReviewEditSection = (termIdx, sectIdx) => {
    setReviewEdit((prev) => ({
      ...prev,
      sectionIdx: [termIdx === 0 ? sectIdx : null, termIdx === 1 ? sectIdx : null],
      editSectionValue: sections[termIdx][sectIdx],
      editTerm: termIdx,
    }));
  };
  const handleReviewSaveSection = () => {
    const termIdx = reviewEdit.editTerm;
    const sectIdx = reviewEdit.sectionIdx[termIdx];
    const updated = [...sections];
    updated[termIdx][sectIdx] = reviewEdit.editSectionValue;
    setSections(updated);
    setReviewEdit((prev) => ({
      ...prev,
      sectionIdx: [null, null],
      editSectionValue: "",
      editTerm: null,
    }));
  };
  const handleReviewDeleteSection = (termIdx, sectIdx) => {
    const updated = [...sections];
    updated[termIdx].splice(sectIdx, 1);
    setSections(updated);
    setReviewEdit((prev) => ({
      ...prev,
      sectionIdx: [null, null],
      editSectionValue: "",
      editTerm: null,
    }));
  };

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);

  // Modern styles
  const cardStyle = {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "32px",
    maxWidth: 900,
    width: "100%",
    margin: "auto",
  };
  const inputStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "12px",
    width: "100%",
    fontSize: "16px",
  };
  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    background: "#007bff",
    color: "#fff",
    fontWeight: "bold",
    margin: "8px 4px 0 0",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background 0.2s",
  };
  const deleteButtonStyle = {
    ...buttonStyle,
    background: "#dc3545",
  };
  const editButtonStyle = {
    ...buttonStyle,
    background: "#ffc107",
    color: "#333",
  };

  // New: tab state
  const [activeTab, setActiveTab] = useState("create");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f8fa",
        position: "relative",
        flexDirection: "column",
      }}
    >
      {/* Settings Icon in top right */}
      <img
        src="/src/img/Settingss.png"
        alt="Settings"
        style={{
          position: "absolute",
          top: 32,
          right: 48,
          width: 40,
          height: 40,
          cursor: "pointer",
          zIndex: 2000,
        }}
        onClick={() => navigate("/Customsetting")}
        title="Settings"
      />

      <div style={cardStyle}>
        {/* Step Indicator */}
        <div style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto 24px auto",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {["Course", "Term", "Subjects", "Sections", "Year Level", "Review"].map((label, idx) => (
            <div key={label} style={{
              flex: 1,
              height: "8px",
              borderRadius: "4px",
              background: idx <= (
                step === "course" ? 0 :
                step === "term" ? 1 :
                step === "subjects" ? 2 :
                step === "sections" ? 3 :
                step === "yearLevel" ? 4 :
                showReview ? 5 : 0
              ) ? "#4CAF50" : "#e0e0e0"
            }} />
          ))}
        </div>

        {!done ? (
          <>
            {step === "course" && (
              <form onSubmit={handleCourseCreate}>
                <h2 style={{ marginBottom: 24 }}>Create Course</h2>
                <input
                  type="text"
                  placeholder="Course Name"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                  style={inputStyle}
                />
                  {/* Excel Upload for Batch Course Creation */}
                  <div style={{ margin: "16px 0" }}>
                    <label style={{ fontWeight: "bold", color: "#333", fontSize: "1rem", marginRight: "12px" }}>
                      Batch Add via Excel:
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        style={{ marginLeft: 8 }}
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (evt) => {
                            const data = new Uint8Array(evt.target.result);
                            const workbook = XLSX.read(data, { type: "array" });
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);

                            // Accept columns: course, year_level, subjects_1st_term, sections_1st_term, subjects_2nd_term, sections_2nd_term
                            if (!Array.isArray(jsonData) || jsonData.length === 0) {
                              setSaveError("Excel file is empty or invalid format.");
                              return;
                            }

                            // Parse each row for multi-term support
                            const parsed = jsonData.map(row => ({
                              course: row.course || "",
                              year_level: row.year_level || "",
                              subjects: [
                                typeof row.subjects_1st_term === "string"
                                  ? row.subjects_1st_term.split(",").map(s => s.trim()).filter(Boolean)
                                  : [],
                                typeof row.subjects_2nd_term === "string"
                                  ? row.subjects_2nd_term.split(",").map(s => s.trim()).filter(Boolean)
                                  : [],
                              ],
                              sections: [
                                typeof row.sections_1st_term === "string"
                                  ? row.sections_1st_term.split(",").map(s => s.trim()).filter(Boolean)
                                  : [],
                                typeof row.sections_2nd_term === "string"
                                  ? row.sections_2nd_term.split(",").map(s => s.trim()).filter(Boolean)
                                  : [],
                              ],
                            }));

                            setBatchCourses(parsed);
                            setShowBatchReview(true);
                          };
                          reader.readAsArrayBuffer(file);
                        }}
      // ...existing code...
                      />
                    </label>
                    <div style={{ fontSize: "0.9rem", color: "#888", marginTop: 4 }}>
                      Excel columns expected: course, year_level, subjects (comma separated), sections (comma separated)
                    </div>
                  </div>
                <button type="submit" style={buttonStyle}>Next</button>
              </form>
            )}

            {step === "term" && (
              <div>
                <h2 style={{ marginBottom: 24 }}>Select Term</h2>
                {terms.map((term, idx) => (
                  <button
                    key={term}
                    onClick={() => handleTermSelect(idx)}
                    style={buttonStyle}
                  >
                    {term}
                  </button>
                ))}
                <button onClick={handleBack} style={{ ...buttonStyle, background: "#6c757d", marginTop: 16 }}>
                  Back
                </button>
              </div>
            )}

            {step === "subjects" && (
              <div>
                <h2 style={{ marginBottom: 24 }}>Add Subjects for {terms[selectedTerm]}</h2>
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={handleAddSubject} style={buttonStyle}>Add Subject</button>
                <ul style={{ marginTop: 16 }}>
                  {subjects[selectedTerm].map((subj, idx) => (
                    <li key={idx} style={{ marginBottom: 8 }}>
                      {editingSubjectIdx === idx ? (
                        <>
                          <input
                            type="text"
                            value={editSubjectValue}
                            onChange={(e) => setEditSubjectValue(e.target.value)}
                            style={inputStyle}
                          />
                          <button onClick={handleSaveSubject} style={editButtonStyle}>Save</button>
                          <button onClick={() => setEditingSubjectIdx(null)} style={buttonStyle}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <span style={{ marginRight: 12 }}>{subj}</span>
                          <button onClick={() => handleEditSubject(idx)} style={editButtonStyle}>Edit</button>
                          <button onClick={() => handleDeleteSubject(idx)} style={deleteButtonStyle}>Delete</button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <button onClick={handleDoneSubjects} style={buttonStyle}>Done</button>
                <button onClick={handleBack} style={{ ...buttonStyle, background: "#6c757d", marginTop: 16 }}>
                  Back
                </button>
              </div>
            )}

            {step === "sections" && (
              <div>
                <h2 style={{ marginBottom: 24 }}>Add Sections for {terms[selectedTerm]}</h2>
                <input
                  type="text"
                  placeholder="Section Name"
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={handleAddSection} style={buttonStyle}>Add Section</button>
                <ul style={{ marginTop: 16 }}>
                  {sections[selectedTerm].map((sect, idx) => (
                    <li key={idx} style={{ marginBottom: 8 }}>
                      {editingSectionIdx === idx ? (
                        <>
                          <input
                            type="text"
                            value={editSectionValue}
                            onChange={(e) => setEditSectionValue(e.target.value)}
                            style={inputStyle}
                          />
                          <button onClick={handleSaveSection} style={editButtonStyle}>Save</button>
                          <button onClick={() => setEditingSectionIdx(null)} style={buttonStyle}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <span style={{ marginRight: 12 }}>{sect}</span>
                          <button onClick={() => handleEditSection(idx)} style={editButtonStyle}>Edit</button>
                          <button onClick={() => handleDeleteSection(idx)} style={deleteButtonStyle}>Delete</button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <button onClick={handleDoneSections} style={buttonStyle}>Done</button>
                <button onClick={handleBack} style={{ ...buttonStyle, background: "#6c757d", marginTop: 16 }}>
                  Back
                </button>
              </div>
            )}

            {step === "yearLevel" && isTeacher && (
              <div>
                <h2 style={{ marginBottom: 24 }}>Select Year Level</h2>
                <select
                  value={yearLevel}
                  onChange={e => setYearLevel(e.target.value)}
                  style={{ ...inputStyle, maxWidth: 200 }}
                >
                  <option value="">Select Year Level</option>
                  {yearLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
                {yearLevel && (
                  <div style={{ marginTop: 16 }}>
                    <strong>Selected Year Level:</strong> {yearLevel}
                    <button onClick={() => setYearLevel("")} style={deleteButtonStyle}>Delete</button>
                  </div>
                )}
                {yearLevel && (
                  <button
                    style={{ ...buttonStyle, marginTop: 24, background: "#28a745" }}
                    onClick={() => setShowReview(true)}
                  >
                    Review All Inputs
                  </button>
                )}
                <button onClick={handleBack} style={{ ...buttonStyle, background: "#6c757d", marginTop: 16 }}>
                  Back
                </button>
              </div>
            )}

            {/* Course Preview */}
            {/* ...existing code... */}
            {/* Review Modal */}
            {showReview && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
                onClick={() => setShowReview(false)}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "24px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    padding: "48px",
                    minWidth: 900,
                    maxWidth: 1400,
                    width: "95vw",
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    gap: "48px",
                    maxHeight: "90vh",
                    overflow: "auto",
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ flex: 1, minWidth: 350 }}>
                    <h2 style={{ marginBottom: 32, textAlign: "left", fontSize: "2.5rem" }}>Review Your Inputs</h2>
                    {/* Course Name */}
                    <div style={{ marginBottom: 32, fontSize: "1.5rem", display: "flex", alignItems: "center" }}>
                      <strong>Course:</strong>
                      {reviewEdit.course ? (
                        <>
                          <input
                            type="text"
                            value={reviewEdit.editCourseValue}
                            onChange={e => setReviewEdit(prev => ({ ...prev, editCourseValue: e.target.value }))}
                            style={{ ...inputStyle, fontSize: "1.2rem", marginLeft: 12, width: "60%" }}
                          />
                          <button onClick={handleReviewSaveCourse} style={editButtonStyle}>Save</button>
                          <button onClick={() => setReviewEdit(prev => ({ ...prev, course: false }))} style={buttonStyle}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <span style={{ marginLeft: 12 }}>{course}</span>
                          <button onClick={handleReviewEditCourse} style={editButtonStyle}>Edit</button>
                        </>
                      )}
                    </div>
                    {/* Year Level */}
                    <div style={{ marginBottom: 32, fontSize: "1.5rem", display: "flex", alignItems: "center" }}>
                      <strong>Year Level:</strong>
                      {reviewEdit.yearLevel ? (
                        <>
                          <select
                            value={reviewEdit.editYearLevelValue}
                            onChange={e => setReviewEdit(prev => ({ ...prev, editYearLevelValue: e.target.value }))}
                            style={{ ...inputStyle, fontSize: "1.2rem", marginLeft: 12, width: "60%" }}
                          >
                            <option value="">Select Year Level</option>
                            {yearLevels.map((lvl) => (
                              <option key={lvl} value={lvl}>{lvl}</option>
                            ))}
                          </select>
                          <button onClick={handleReviewSaveYearLevel} style={editButtonStyle}>Save</button>
                          <button onClick={() => setReviewEdit(prev => ({ ...prev, yearLevel: false }))} style={buttonStyle}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <span style={{ marginLeft: 12 }}>{yearLevel}</span>
                          <button onClick={handleReviewEditYearLevel} style={editButtonStyle}>Edit</button>
                          <button onClick={() => setYearLevel("")} style={deleteButtonStyle}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 2, minWidth: 500, overflowY: "auto", maxHeight: "70vh" }}>
                    <div style={{ display: "flex", gap: "48px" }}>
                      {terms.map((term, tIdx) => (
                        <div key={term} style={{ minWidth: 220 }}>
                          <strong style={{ fontSize: "2rem" }}>{term}</strong>
                          {/* Subjects */}
                          <div style={{ marginTop: 16 }}>
                            <strong style={{ fontSize: "1.2rem" }}>Subjects:</strong>
                            <ul style={{ margin: 0, paddingLeft: 24, maxHeight: 180, overflowY: "auto", fontSize: "1.1rem" }}>
                              {subjects[tIdx].length === 0 ? (
                                <li style={{ color: "#888" }}>No subjects added</li>
                              ) : (
                                subjects[tIdx].map((subj, idx) =>
                                  reviewEdit.subjectIdx[tIdx] === idx ? (
                                    <li key={idx} style={{ marginBottom: 8 }}>
                                      <input
                                        type="text"
                                        value={reviewEdit.editSubjectValue}
                                        onChange={e => setReviewEdit(prev => ({ ...prev, editSubjectValue: e.target.value }))}
                                        style={{ ...inputStyle, fontSize: "1.1rem", width: "60%" }}
                                      />
                                      <button onClick={handleReviewSaveSubject} style={editButtonStyle}>Save</button>
                                      <button onClick={() => setReviewEdit(prev => ({
                                        ...prev,
                                        subjectIdx: [null, null],
                                        editSubjectValue: "",
                                        editTerm: null,
                                      }))} style={buttonStyle}>Cancel</button>
                                    </li>
                                  ) : (
                                    <li key={idx} style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
                                      <span>{subj}</span>
                                      <button onClick={() => handleReviewEditSubject(tIdx, idx)} style={editButtonStyle}>Edit</button>
                                      <button onClick={() => handleReviewDeleteSubject(tIdx, idx)} style={deleteButtonStyle}>Delete</button>
                                    </li>
                                  )
                                )
                              )}
                            </ul>
                          </div>
                          {/* Sections */}
                          <div style={{ marginTop: 16 }}>
                            <strong style={{ fontSize: "1.2rem" }}>Sections:</strong>
                            <ul style={{ margin: 0, paddingLeft: 24, maxHeight: 180, overflowY: "auto", fontSize: "1.1rem" }}>
                              {sections[tIdx].length === 0 ? (
                                <li style={{ color: "#888" }}>No sections added</li>
                              ) : (
                                sections[tIdx].map((sect, idx) =>
                                  reviewEdit.sectionIdx[tIdx] === idx ? (
                                    <li key={idx} style={{ marginBottom: 8 }}>
                                      <input
                                        type="text"
                                        value={reviewEdit.editSectionValue}
                                        onChange={e => setReviewEdit(prev => ({ ...prev, editSectionValue: e.target.value }))}
                                        style={{ ...inputStyle, fontSize: "1.1rem", width: "60%" }}
                                      />
                                      <button onClick={handleReviewSaveSection} style={editButtonStyle}>Save</button>
                                      <button onClick={() => setReviewEdit(prev => ({
                                        ...prev,
                                        sectionIdx: [null, null],
                                        editSectionValue: "",
                                        editTerm: null,
                                      }))} style={buttonStyle}>Cancel</button>
                                    </li>
                                  ) : (
                                    <li key={idx} style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
                                      <span>{sect}</span>
                                      <button onClick={() => handleReviewEditSection(tIdx, idx)} style={editButtonStyle}>Edit</button>
                                      <button onClick={() => handleReviewDeleteSection(tIdx, idx)} style={deleteButtonStyle}>Delete</button>
                                    </li>
                                  )
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    style={{
                      position: "absolute",
                      bottom: 24,
                      right: 24,
                      padding: "14px 32px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#28a745",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      margin: 0,
                      width: "auto",
                    }}
                    onClick={handleDone}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "DONE"}
                  </button>
                  {saveError && (
                    <div style={{ color: "#dc3545", fontWeight: "bold", marginTop: 16 }}>{saveError}</div>
                  )}
                  <button
                    style={{
                      position: "absolute",
                      top: 24,
                      right: 24,
                      padding: "14px 32px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#6c757d",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      margin: 0,
                      width: "auto",
                    }}
                    onClick={() => setShowReview(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <img src="/src/img/success.png" alt="Success" style={{ width: 80, height: 80 }} />
            </div>
            <h2 style={{ marginBottom: 24, color: "#28a745" }}>Course Saved Successfully!</h2>
            {/* Home Button */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <button
                style={{
                  padding: "12px 32px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#007bff",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "18px",
                  cursor: "pointer",
                  margin: "0 8px",
                }}
                onClick={() => {
                  setDone(false);
                  setStep("course");
                  setCourse("");
                  setYearLevel("");
                  setSubjects([[], []]);
                  setSections([[], []]);
                  setSelectedTerm(0);
                  setShowReview(false);
                  setSaveError("");
                }}
              >
                Home / Create Another Course
              </button>
            </div>
            <h3>All Courses (Visible to Teachers):</h3>
            <div style={{ maxHeight: 400, overflowY: "auto", marginTop: 16 }}>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchCourse}
                onChange={e => setSearchCourse(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  marginBottom: "12px",
                  width: "100%",
                  fontSize: "15px"
                }}
              />
              {coursesLoading ? (
                <div>Loading courses...</div>
              ) : allCourses.length === 0 ? (
                <div>No courses found.</div>
              ) : (
                allCourses
                .filter(c => c.course.toLowerCase().includes(searchCourse.toLowerCase()))
                .map((c, idx) => (
                  <div key={c.id || idx} style={{ background: "#f8f9fa", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                    <strong>Course:</strong> {c.course}<br />
                    <strong>Year Level:</strong> {c.year_level}<br />
                    <strong>Subjects:</strong>
                    <ul>
                      {c.subjects?.map((subArr, tIdx) =>
                        subArr.map((sub, sIdx) => (
                          <li key={tIdx + "-" + sIdx}>{sub}</li>
                        ))
                      )}
                    </ul>
                    <strong>Sections:</strong>
                    <ul>
                      {c.sections?.map((secArr, tIdx) =>
                        secArr.map((sec, sIdx) => (
                          <li key={tIdx + "-" + sIdx}>{sec}</li>
                        ))
                      )}
                    </ul>
                    <span style={{ fontSize: "0.9rem", color: "#888" }}>Created: {c.created_at?.slice(0, 19).replace("T", " ")}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Show history at the bottom, always visible */}
        {history.length > 0 ? (
          <div style={{
            marginTop: 40,
            padding: "24px 0",
            background: "linear-gradient(90deg, #f6f8fa 80%, #e8f5e9 100%)",
            borderRadius: "18px",
            boxShadow: "0 2px 12px rgba(76,175,80,0.07)",
            maxWidth: 900,
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            <h3 style={{
              textAlign: "center",
              fontSize: "2rem",
              color: "#388E3C",
              marginBottom: "24px",
              fontWeight: 700,
              letterSpacing: "1px"
            }}>
              <span style={{ verticalAlign: "middle", marginRight: 8 }}>
                <img src="/src/img/history.png" alt="History" style={{ width: 32, height: 32, filter: "grayscale(0.2)" }} />
              </span>
              Course History
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "18px",
              padding: "0 18px"
            }}>
              {history.map((h) => (
                <div
                  key={h.id}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 2px 8px rgba(76,175,80,0.08)",
                    padding: "18px 20px",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                    borderLeft: h.action === "created"
                      ? "6px solid #4CAF50"
                      : h.action === "edited"
                      ? "6px solid #FFC107"
                      : "6px solid #F44336"
                  }}
                  onClick={() => {
                    setSelectedHistory(h);
                    setShowHistoryModal(true);
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      fontWeight: 700,
                      color: h.action === "created"
                        ? "#4CAF50"
                        : h.action === "edited"
                        ? "#FFC107"
                        : "#F44336",
                      fontSize: "1.1rem"
                    }}>
                      {h.action.toUpperCase()}
                    </span>
                    <span style={{ color: "#888", fontSize: "0.95rem" }}>
                      {h.changed_at?.slice(0, 19).replace("T", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: "1.1rem", color: "#333", margin: "8px 0" }}>
                    <strong>{h.details.course}</strong>
                  </div>
                  <div style={{ color: "#388E3C", fontWeight: 500 }}>
                    {h.details.year_level}
                  </div>
                  <div style={{ fontSize: "0.95rem", color: "#444", marginTop: 6 }}>
                    <span style={{ fontWeight: 500 }}>Subjects:</span>
                    <span>
          {h.details.subjects?.map((subArr, tIdx) =>
            subArr.length > 0 ? `${terms[tIdx]}: ${subArr.join(", ")} ` : ""
          ).join(" | ")}
        </span>
                  </div>
                  <div style={{ fontSize: "0.95rem", color: "#444", marginTop: 2 }}>
                    <span style={{ fontWeight: 500 }}>Sections:</span>
                    <span>
          {h.details.sections?.map((secArr, tIdx) =>
            secArr.length > 0 ? `${terms[tIdx]}: ${secArr.join(", ")} ` : ""
          ).join(" | ")}
        </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", marginTop: 40, color: "#888", fontSize: "1.2rem" }}>
            No course history found.
          </div>
        )}
      </div>

      {showHistoryModal && selectedHistory && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
    }}
    onClick={() => setShowHistoryModal(false)}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: "24px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        padding: "48px",
        minWidth: 400,
        maxWidth: 600,
        width: "95vw",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxHeight: "90vh",
        overflow: "auto",
      }}
      onClick={e => e.stopPropagation()}
    >
      <h2 style={{ marginBottom: 12, color: "#388E3C" }}>
        {selectedHistory.details.course}
      </h2>
      <div>
        <strong>Year Level:</strong> {selectedHistory.details.year_level}
      </div>
      <div>
        <strong>Subjects:</strong>
        <ul>
          {selectedHistory.details.subjects?.map((subArr, tIdx) =>
            subArr.length > 0 ? (
              <li key={tIdx}>
                <span style={{ color: "#388E3C", fontWeight: 500 }}>{terms[tIdx]}:</span>
                <span> {subArr.join(", ")}</span>
              </li>
            ) : null
          )}
        </ul>
      </div>
      <div>
        <strong>Sections:</strong>
        <ul>
          {selectedHistory.details.sections?.map((secArr, tIdx) =>
            secArr.length > 0 ? (
              <li key={tIdx}>
                <span style={{ color: "#388E3C", fontWeight: 500 }}>{terms[tIdx]}:</span>
                <span> {secArr.join(", ")}</span>
              </li>
            ) : null
          )}
        </ul>
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
        <button
          style={{
            ...buttonStyle,
            background: "#ffc107",
            color: "#333",
            flex: 1,
          }}
          onClick={() => {
            // TODO: Implement edit logic
            alert("Edit feature coming soon!");
          }}
        >
          Edit
        </button>
        <button
          style={{
            ...buttonStyle,
            background: "#dc3545",
            flex: 1,
          }}
          onClick={async () => {
            // TODO: Implement delete logic
            await supabase.from("courses").delete().eq("id", selectedHistory.course_id);
            await supabase.from("course_history").delete().eq("id", selectedHistory.id);
            setShowHistoryModal(false);
            fetchCourses();
            fetchHistory();
          }}
        >
          Delete
        </button>
        <button
          style={{
            ...buttonStyle,
            background: "#4CAF50",
            flex: 1,
          }}
          onClick={() => {
            setShowHistoryModal(false);
            setDone(false);
            setStep("course");
            setCourse("");
            setYearLevel("");
            setSubjects([[], []]);
            setSections([[], []]);
            setSelectedTerm(0);
            setShowReview(false);
            setSaveError("");
          }}
        >
          Add New
        </button>
      </div>
      <button
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          padding: "10px 24px",
          borderRadius: "10px",
          border: "none",
          background: "#6c757d",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "1.1rem",
          cursor: "pointer",
        }}
        onClick={() => setShowHistoryModal(false)}
      >
        Close
      </button>
    </div>
  </div>
)}
      {showBatchReview && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }}
    onClick={() => setShowBatchReview(false)}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: "24px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        padding: "48px",
        minWidth: 900,
        maxWidth: 1400,
        width: "95vw",
        position: "relative",
        maxHeight: "90vh",
        overflow: "auto",
      }}
      onClick={e => e.stopPropagation()}
    >
      <h2 style={{ marginBottom: 32, fontSize: "2rem" }}>Review Batch Courses</h2>
      {batchCourses.map((bc, idx) => (
        <div key={idx} style={{ marginBottom: 32, borderBottom: "1px solid #eee", paddingBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <strong>Course Name:</strong>
            <input
              type="text"
              value={bc.course}
              onChange={e => {
                const updated = [...batchCourses];
                updated[idx].course = e.target.value;
                setBatchCourses(updated);
              }}
              style={{ ...inputStyle, marginLeft: 12, width: "60%" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Year Level:</strong>
            <select
              value={bc.year_level}
              onChange={e => {
                const updated = [...batchCourses];
                updated[idx].year_level = e.target.value;
                setBatchCourses(updated);
              }}
              style={{ ...inputStyle, marginLeft: 12, width: "60%" }}
            >
              <option value="">Select Year Level</option>
              {yearLevels.map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
          {/* Show subjects and sections for each term separately */}
          {terms.map((term, tIdx) => (
            <div key={term} style={{ marginBottom: 12, paddingLeft: 12 }}>
              <strong>{term}:</strong>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 500 }}>Subjects:</span>
                <input
                  type="text"
                  value={bc.subjects[tIdx]?.join(", ") || ""}
                  onChange={e => {
                    const updated = [...batchCourses];
                    updated[idx].subjects[tIdx] = e.target.value.split(",").map(s => s.trim());
                    setBatchCourses(updated);
                  }}
                  style={{ ...inputStyle, marginLeft: 12, width: "60%" }}
                  placeholder="Comma separated"
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 500 }}>Sections:</span>
                <input
                  type="text"
                  value={bc.sections[tIdx]?.join(", ") || ""}
                  onChange={e => {
                    const updated = [...batchCourses];
                    updated[idx].sections[tIdx] = e.target.value.split(",").map(s => s.trim());
                    setBatchCourses(updated);
                  }}
                  style={{ ...inputStyle, marginLeft: 12, width: "60%" }}
                  placeholder="Comma separated"
                />
              </div>
            </div>
          ))}
          <button
            style={{ ...deleteButtonStyle, marginTop: 8 }}
            onClick={() => {
              const updated = batchCourses.filter((_, i) => i !== idx);
              setBatchCourses(updated);
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        style={{
          ...buttonStyle,
          background: "#28a745",
          fontSize: "1.2rem",
          padding: "14px 32px",
          marginTop: 24,
        }}
        onClick={async () => {
          setBatchSaving(true);
          setBatchSaveError("");
          try {
            // Insert all courses
            const { data, error } = await supabase.from("courses").insert(
              batchCourses.map(bc => ({
                course: bc.course,
                year_level: bc.year_level,
                subjects: bc.subjects,
                sections: bc.sections,
              }))
            ).select();
            if (error) throw error;
            // Insert history for each
            if (data) {
              await supabase.from("course_history").insert(
                data.map((c, i) => ({
                  course_id: c.id,
                  action: "created",
                  details: {
                    course: batchCourses[i].course,
                    year_level: batchCourses[i].year_level,
                    subjects: batchCourses[i].subjects,
                    sections: batchCourses[i].sections,
                  },
                  changed_by: "teacher",
                }))
              );
            }
            setShowBatchReview(false);
            setBatchCourses([]);
            fetchCourses();
            fetchHistory();
          } catch (err) {
            setBatchSaveError("Failed to save batch. Please try again.");
          } finally {
            setBatchSaving(false);
          }
        }}
        disabled={batchSaving}
      >
        {batchSaving ? "Saving..." : "Done & Save All"}
      </button>
      {batchSaveError && (
        <div style={{ color: "#dc3545", fontWeight: "bold", marginTop: 16 }}>{batchSaveError}</div>
      )}
      <button
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          padding: "14px 32px",
          borderRadius: "10px",
          border: "none",
          background: "#6c757d",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "1.2rem",
          cursor: "pointer",
          margin: 0,
          width: "auto",
        }}
        onClick={() => setShowBatchReview(false)}
      >
        Close
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default Custom;