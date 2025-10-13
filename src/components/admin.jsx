import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Admin = () => {
  // Pagination settings
  const TEACHERS_PER_PAGE = 3;  // Adjust as needed
  const STUDENTS_PER_PAGE = 3;  // Adjust as needed

  // States for teachers, students, loading, error, etc.
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Teacher search + pagination
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [teacherPage, setTeacherPage] = useState(0);

  // Student search + pagination
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentPage, setStudentPage] = useState(0);

  // States for grade report assignment form
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  // NEW: Term selection state
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  // States for assignments and currently viewed assignment details
  const [assignments, setAssignments] = useState([]);
  const [selectedStudentAssignments, setSelectedStudentAssignments] = useState(null);

  // States for admin history logs
  const [adminHistory, setAdminHistory] = useState([]);

  // Pagination states for action history
  const [historyPage, setHistoryPage] = useState(0);
  const HISTORY_PER_PAGE = 5; // Number of history entries per page

  // Arrays for selection options
  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  // New term options array
  const termOptions = ["1st Term", "2nd Term"];

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

  const defaultSections = [
    "Section 1",
    "Section 2",
    "Section 3",
    "Section 4",
    "Section 5",
    "Section 6",
    "Section 7",
    "Section 8",
    "Section 9",
    "Section 10",
    "Section 11",
    "Section 12",
    "Section 13",
    "Section 14",
    "Section 15",
  ];

  // Exam types that will be auto-created
  const examTypes = ["Prelim", "Midterm", "Pre-Final", "Final"];

  const subjects = [
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

  // Fetch teachers and students on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("*");
        if (teacherError) throw teacherError;
        setTeachers(teacherData);

        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*");
        if (studentError) throw studentError;
        setStudents(studentData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch assignments (grade report entries)
  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("grade_reports")
      .select(`
        id,
        teacher_id,
        student_id,
        course,
        section,
        subject,
        exam_type,
        term,
        status,
        created_at,
        student:students(*),
        teacher:teachers(*)
      `);
    if (error) {
      console.error("Error fetching assignments:", error);
    } else {
      setAssignments(data || []);
      console.log("Fetched Assignments:", data);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Fetch admin history logs
  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("admin_history")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching admin history:", error);
    } else {
      setAdminHistory(data || []);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Calculate total pages for history
  const totalHistoryPages = Math.ceil(adminHistory.length / HISTORY_PER_PAGE);

  // Get the history entries for the current page
  const historyStartIndex = historyPage * HISTORY_PER_PAGE;
  const historyEndIndex = historyStartIndex + HISTORY_PER_PAGE;
  const historyForPage = adminHistory.slice(historyStartIndex, historyEndIndex);

  // Helper function to log admin actions
  const logAdminHistory = async (action) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const adminId = user ? user.id : null;
    const { error } = await supabase.from("admin_history").insert([
      { admin_id: adminId, action },
    ]);
    if (error) {
      console.error("Error logging admin history:", error);
    } else {
      fetchHistory();
    }
  };

  // Handle assignment submission with improved duplicate check
  const handleAssignGradeReport = async (e) => {
    e.preventDefault();

    // Ensure all required fields are filled
    if (
      !selectedTeacher ||
      !selectedYearLevel ||
      !selectedTerm ||
      !selectedStudent ||
      !selectedCourse ||
      !selectedSection ||
      !selectedSubject
    ) {
      setReportMessage("Please fill out all fields.");
      return;
    }

    // Fetch existing reports for the current combination (including subject)
    const { data: existingReports, error: fetchError } = await supabase
      .from("grade_reports")
      .select("exam_type, subject")
      .eq("teacher_id", selectedTeacher)
      .eq("student_id", selectedStudent)
      .eq("course", selectedCourse)
      .eq("section", selectedSection)
      .eq("term", selectedTerm);

    if (fetchError) {
      setReportMessage("Error checking existing grade reports: " + fetchError.message);
      return;
    }

    // Determine exam types that have not been added yet for this combination
    const existingEntries = existingReports
      ? existingReports.map((r) => `${r.exam_type}-${r.subject}`)
      : [];
    const examTypesToInsert = examTypes.filter(
      (exam) => !existingEntries.includes(`${exam}-${selectedSubject}`)
    );

    if (examTypesToInsert.length === 0) {
      setReportMessage(
        `Grade report entries for this student in ${selectedSubject} already exist.`
      );
      return;
    }

    let insertedCount = 0;
    for (const exam of examTypesToInsert) {
      const { error } = await supabase.from("grade_reports").insert([
        {
          teacher_id: selectedTeacher,
          student_id: selectedStudent,
          course: selectedCourse,
          section: selectedSection,
          subject: selectedSubject,
          exam_type: exam,
          term: selectedTerm,
          status: "assigned",
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        setReportMessage("Error adding grade report: " + error.message);
        return;
      } else {
        insertedCount++;
      }
    }

    if (insertedCount === 0) {
      setReportMessage(
        `Grade report entries for this student in ${selectedSubject} already exist.`
      );
      return;
    } else {
      const studentObj =
        students.find((s) => s.id === selectedStudent) || { username: "Unknown Student" };
      const logMessage = `Added ${insertedCount} grade report entries for ${studentObj.username} in ${selectedCourse}, ${selectedSection}, ${selectedSubject}, ${selectedTerm} on ${new Date().toLocaleString()}`;
      setReportMessage("Grade report entries successfully added!");
      await logAdminHistory(logMessage);

      // Clear form fields
      setSelectedTeacher("");
      setSelectedYearLevel("");
      setSelectedTerm("");
      setSelectedStudent("");
      setTeacherSearchQuery("");
      setStudentSearchQuery("");
      setSelectedCourse("");
      setSelectedSection("");
      setSelectedSubject("");
      fetchAssignments();
    }
  };

  // 1. Teacher Search + Pagination
  const filteredTeachers =
    teacherSearchQuery.trim().length > 0
      ? teachers.filter((teacher) =>
          teacher.username.toLowerCase().includes(teacherSearchQuery.toLowerCase())
        )
      : teachers;

  // Calculate total teacher pages
  const totalTeacherPages = Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE);

  // Slice the teacher array to get the teachers for the current page
  const teacherStartIndex = teacherPage * TEACHERS_PER_PAGE;
  const teacherEndIndex = teacherStartIndex + TEACHERS_PER_PAGE;
  const teachersForPage = filteredTeachers.slice(teacherStartIndex, teacherEndIndex);

  // 2. Student Search + Pagination
  const filteredStudentsBase = selectedYearLevel
    ? students.filter(
        (student) =>
          student.year_level &&
          student.year_level.trim().toLowerCase() === selectedYearLevel.trim().toLowerCase() &&
          student.username.toLowerCase().includes(studentSearchQuery.toLowerCase())
      )
    : students.filter((student) =>
        student.username.toLowerCase().includes(studentSearchQuery.toLowerCase())
      );

  // Calculate total student pages
  const totalStudentPages = Math.ceil(filteredStudentsBase.length / STUDENTS_PER_PAGE);

  // Slice the student array to get the students for the current page
  const studentStartIndex = studentPage * STUDENTS_PER_PAGE;
  const studentEndIndex = studentStartIndex + STUDENTS_PER_PAGE;
  const studentsForPage = filteredStudentsBase.slice(studentStartIndex, studentEndIndex);

  // When a student row is clicked, show all assignments for that student
  const handleStudentClick = (studentId) => {
    const studentAssignments = assignments.filter((a) => a.student_id === studentId);
    if (studentAssignments.length > 0) {
      setSelectedStudentAssignments(studentAssignments);
    }
  };

  // Render assignment details modal for all assignments of a student
  const renderAssignmentDetails = (assignmentList) => (
    <div>
      <h3>Assignment Details for Student</h3>
      {assignmentList.map((assignment) => (
        <div
          key={assignment.id}
          style={{ borderBottom: "1px solid #ccc", marginBottom: "5px", paddingBottom: "5px" }}
        >
          <p>
            <strong>Teacher:</strong> {assignment.teacher?.username || assignment.teacher_id}
          </p>
          <p>
            <strong>Course:</strong> {assignment.course}
          </p>
          <p>
            <strong>Section:</strong> {assignment.section}
          </p>
          <p>
            <strong>Subject:</strong> {assignment.subject}
          </p>
          <p>
            <strong>Exam:</strong> {assignment.exam_type}
          </p>
          <p>
            <strong>Term:</strong> {assignment.term}
          </p>
          <p>
            <strong>Status:</strong> {assignment.status}
          </p>
          <p>
            <strong>Assigned On:</strong> {new Date(assignment.created_at).toLocaleString()}
          </p>
        </div>
      ))}
      <button onClick={() => setSelectedStudentAssignments(null)}>Close Details</button>
    </div>
  );

  return (
<div
  className="admin-dashboard"
  style={{
    padding: "20px",
    maxWidth: "100%",
    overflowX: "hidden",
    boxSizing: "border-box",
    fontSize: "0.9rem",
  }}
>
      <div>
        <Link to="/adminsetting">
          <div
            title="Settings"
            className="settings"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "10px 20px 0 0",
            }}
          >
            <img src="/src/img/settingss.png" alt="Settings" className="settings-icon" />
          </div>
        </Link>
        <div
          style={{
            textAlign: "center",
            fontSize: "2rem",
            color: "#4CAF50",
            fontStyle: "italic",
            marginTop: "10px",
            fontWeight: "bold",
          }}
        >
          Admin Dashboard
        </div>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p style={{ color: "red" }}>Error: {error}</p>
      ) : (
        <>
          {/* TEACHERS SECTION */}
          <h2>Teachers</h2>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Search teachers..."
              value={teacherSearchQuery}
              onChange={(e) => {
                setTeacherSearchQuery(e.target.value);
                setTeacherPage(0);
              }}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          <table border="1" cellPadding="8" cellSpacing="0">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {teachersForPage.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.username}</td>
                  <td>{teacher.email}</td>
                  <td>
                    {teacher.created_at
                      ? new Date(teacher.created_at).toLocaleString()
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={() => setTeacherPage(Math.max(teacherPage - 1, 0))}
              disabled={teacherPage === 0}
            >
              Prev
            </button>
            <span style={{ margin: "0 10px" }}>
              Page {teacherPage + 1} of {totalTeacherPages || 1}
            </span>
            <button
              onClick={() =>
                setTeacherPage(Math.min(teacherPage + 1, totalTeacherPages - 1))
              }
              disabled={teacherPage >= totalTeacherPages - 1}
            >
              Next
            </button>
          </div>

          {/* STUDENTS SECTION */}
          <h2 style={{ marginTop: "40px" }}>Students</h2>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Search students..."
              value={studentSearchQuery}
              onChange={(e) => {
                setStudentSearchQuery(e.target.value);
                setStudentPage(0);
              }}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
            <table
              border="1"
              cellPadding="8"
              cellSpacing="0"
              style={{
                minWidth: "700px", // Ensures the table has a minimum width
                fontSize: "0.9rem", // Slightly smaller font size for better fit
              }}
            >
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Section</th>
                  <th>Year Level</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsForPage.map((student) => (
                  <tr
                    key={student.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleStudentClick(student.id)}
                  >
                    <td>{student.username}</td>
                    <td>{student.email}</td>
                    <td>{student.course}</td>
                    <td>{student.section}</td>
                    <td>{student.year_level || "N/A"}</td>
                    <td>
                      {student.created_at
                        ? new Date(student.created_at).toLocaleString()
                        : ""}
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudentClick(student.id);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={() => setStudentPage(Math.max(studentPage - 1, 0))}
              disabled={studentPage === 0}
            >
              Prev
            </button>
            <span style={{ margin: "0 10px" }}>
              Page {studentPage + 1} of {totalStudentPages || 1}
            </span>
            <button
              onClick={() =>
                setStudentPage(Math.min(studentPage + 1, totalStudentPages - 1))
              }
              disabled={studentPage >= totalStudentPages - 1}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Grade Report Assignment Form */}
      <div style={{ marginTop: "40px" }}>
        <h2>Add Grade Report Entry</h2>
        <form
          onSubmit={handleAssignGradeReport}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
          }}
        >
          {/* Year Level */}
          <div>
            <label>Year Level: </label>
            <select
              value={selectedYearLevel}
              onChange={(e) => {
                setSelectedYearLevel(e.target.value);
                setStudentSearchQuery("");
                setSelectedStudent("");
              }}
            >
              <option value="">Select Year Level</option>
              {yearLevels.map((level, idx) => (
                <option key={idx} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          {/* Term */}
          <div>
            <label>Term: </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              required
            >
              <option value="">Select Term</option>
              {termOptions.map((term, idx) => (
                <option key={idx} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
          {/* Teacher */}
          <div>
            <label>Teacher: </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">Select Teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.username}
                </option>
              ))}
            </select>
          </div>
          {/* Student Search */}
          <div>
            <label>Student: </label>
            <input
              type="text"
              placeholder="Search student..."
              value={studentSearchQuery}
              onChange={(e) => {
                setStudentSearchQuery(e.target.value);
                setSelectedStudent("");
              }}
              style={{
                width: "200px",
                padding: "8px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {studentSearchQuery.trim().length > 0 && (
              <div
                style={{
                  maxHeight: "150px",
                  overflowY: "auto",
                  border: "1px solid #ccc",
                  marginTop: "5px",
                }}
              >
                {filteredStudentsBase
                  .filter(
                    (s) =>
                      s.year_level &&
                      s.year_level.trim().toLowerCase() ===
                        selectedYearLevel.trim().toLowerCase() &&
                      s.username.toLowerCase().includes(studentSearchQuery.toLowerCase())
                  )
                  .slice(0, 20)
                  .map((student) => (
                    <div
                      key={student.id}
                      onClick={() => {
                        setSelectedStudent(student.id);
                        setStudentSearchQuery(student.username);
                      }}
                      style={{
                        padding: "5px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {student.username}
                    </div>
                  ))}
              </div>
            )}
          </div>
          {/* Course */}
          <div>
            <label>Course: </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Select Course</option>
              {courses.map((course, idx) => (
                <option key={idx} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          {/* Section */}
          <div>
            <label>Section: </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">Select Section</option>
              {defaultSections.map((section, idx) => (
                <option key={idx} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>
          {/* Subject */}
          <div>
            <label>Subject: </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map((subject, idx) => (
                <option key={idx} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          {/* Submit */}
          <div>
            <button type="submit" style={{ padding: "5px 10px" }}>
              Add Grade Report Entry
            </button>
          </div>
        </form>
        {reportMessage && <p style={{ marginTop: "10px" }}>{reportMessage}</p>}
      </div>

      {/* Admin History */}
      <div style={{ marginTop: "40px" }}>
        <h2>Action History</h2>
        {adminHistory.length === 0 ? (
          <p>No history yet.</p>
        ) : (
          <>
            <ul>
              {historyForPage.map((entry) => (
                <li key={entry.id}>
                  {entry.action} - {new Date(entry.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <button
                onClick={() => setHistoryPage(Math.max(historyPage - 1, 0))}
                disabled={historyPage === 0}
                style={{ marginRight: "10px" }}
              >
                Prev
              </button>
              <span>
                Page {historyPage + 1} of {totalHistoryPages || 1}
              </span>
              <button
                onClick={() => setHistoryPage(Math.min(historyPage + 1, totalHistoryPages - 1))}
                disabled={historyPage >= totalHistoryPages - 1}
                style={{ marginLeft: "10px" }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Assignment Details Modal */}
      {selectedStudentAssignments && (
        <div
          style={{
            position: "fixed",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            zIndex: 200,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          {renderAssignmentDetails(selectedStudentAssignments)}
        </div>
      )}
    </div>
  );
};

export default Admin;
