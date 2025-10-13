import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import * as XLSX from "xlsx"; // Add this import at the top

const Admin = () => {
  // Pagination settings
  const TEACHERS_PER_PAGE = 10;  // Adjust as needed
  const STUDENTS_PER_PAGE = 10;  // Adjust as needed

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

  // Add these states for dynamic options
  const [customCourses, setCustomCourses] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [customSubjects, setCustomSubjects] = useState([]);

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
      .from("grade_report")
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

  // Fetch courses from Supabase (created via Custom.jsx)
  useEffect(() => {
    const fetchCustomCourses = async () => {
      const { data, error } = await supabase.from("courses").select("*");
      if (!error && data) {
        setCustomCourses(data);
      }
    };
    fetchCustomCourses();
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

  // Add loading state for grade report submission
  const [addingGradeReport, setAddingGradeReport] = useState(false);

  // Handle assignment submission with improved duplicate check
  const handleAssignGradeReport = async (e) => {
    e.preventDefault();
    setAddingGradeReport(true); // Start loading

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
      setAddingGradeReport(false); // Stop loading
      return;
    }

    // Fetch existing reports for the current combination (including subject)
    const { data: existingReports, error: fetchError } = await supabase
      .from("grade_report")
      .select("exam_type, subject")
      .eq("teacher_id", selectedTeacher)
      .eq("student_id", selectedStudent)
      .eq("course", selectedCourse)
      .eq("section", selectedSection)
      .eq("term", selectedTerm);

    if (fetchError) {
      setReportMessage("Error checking existing grade reports: " + fetchError.message);
      setAddingGradeReport(false); // Stop loading
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
      setAddingGradeReport(false); // Stop loading
      return;
    }

    let insertedCount = 0;
    for (const exam of examTypesToInsert) {
      const { error } = await supabase.from("grade_report").insert([
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
        setAddingGradeReport(false); // Stop loading
        return;
      } else {
        insertedCount++;
      }
    }

    if (insertedCount === 0) {
      setReportMessage(
        `Grade report entries for this student in ${selectedSubject} already exist.`
      );
      setAddingGradeReport(false); // Stop loading
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
    setAddingGradeReport(false); // Stop loading
  };

  // 1. Teacher Search + Pagination
  const filteredTeachers =
    teacherSearchQuery.trim().length > 0
      ? teachers.filter((teacher) =>
          teacher.username.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
          (teacher.teacher_id_number && teacher.teacher_id_number.toLowerCase().includes(teacherSearchQuery.toLowerCase()))
        )
      : teachers;

  // Calculate total teacher pages
  const totalTeacherPages = Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE);

  // Slice the teacher array to get the teachers for the current page
  const teacherStartIndex = teacherPage * TEACHERS_PER_PAGE;
  const teacherEndIndex = teacherStartIndex + TEACHERS_PER_PAGE;
  const teachersForPage = filteredTeachers.slice(teacherStartIndex, teacherEndIndex);

  // 2. Student Search + Pagination
  const filteredStudentsBase = students.filter(
    (student) =>
      student.username.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (student.student_id_number && student.student_id_number.toLowerCase().includes(studentSearchQuery.toLowerCase()))
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

  // Add a state to track which section is active
  const [activeSection, setActiveSection] = useState("teachers");

  // New states for multi-select
  const [multiAddMode, setMultiAddMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);

  // Add these states near the top of your component
  const [batchGradeReports, setBatchGradeReports] = useState([]);
  const [showBatchGradeReview, setShowBatchGradeReview] = useState(false);
  const [batchGradeSaving, setBatchGradeSaving] = useState(false);
  const [batchGradeSaveError, setBatchGradeSaveError] = useState("");

  // Handler for Excel upload
  const handleGradeReportExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        setBatchGradeSaveError("Excel file is empty or invalid format.");
        return;
      }

      // Map student_id_number and teacher_id_number to their UUIDs
      const studentIdMap = {};
      const teacherIdMap = {};
      students.forEach(s => {
        if (s.student_id_number) studentIdMap[s.student_id_number.trim()] = s.id;
      });
      teachers.forEach(t => {
        if (t.teacher_id_number) teacherIdMap[t.teacher_id_number.trim()] = t.id;
      });

      // Expand rows for each student and teacher
      let expanded = [];
      jsonData.forEach(row => {
        // Split and trim student IDs
        const studentIds = (row.student_id_number || "")
          .split(",")
          .map(id => id.trim())
          .filter(id => id.length > 0);

        // Split and trim teacher IDs
        const teacherIds = (row.teacher_id_number || "")
          .split(",")
          .map(id => id.trim())
          .filter(id => id.length > 0);

        // Split subjects if comma-separated
        const subjectsArr = (row.subject || "")
          .split(",")
          .map(sub => sub.trim())
          .filter(sub => sub.length > 0);

        studentIds.forEach(studentIdNum => {
          teacherIds.forEach(teacherIdNum => {
            subjectsArr.forEach(subject => {
              expanded.push({
                year_level: row.year_level || "",
                term: row.term || "",
                student_id: studentIdMap[studentIdNum] || "",
                student_id_number: studentIdNum,
                teacher_id: teacherIdMap[teacherIdNum] || "",
                teacher_id_number: teacherIdNum,
                course: row.course || "",
                section: row.section || "",
                subject: subject,
                exam_type: "Prelim",
                status: "assigned",
                created_at: new Date().toISOString(),
              });
            });
          });
        });
      });

      setBatchGradeReports(expanded);
      setShowBatchGradeReview(true);
    };
    reader.readAsArrayBuffer(file);
  };

  // Render section content based on activeSection
  const renderSection = () => {
    if (activeSection === "teachers") {
      return (
        <>
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
                <th>Teacher ID Number</th> {/* Added column */}
                <th>Email</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {teachersForPage.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.username}</td>
                  <td>{teacher.teacher_id_number || "N/A"}</td> {/* Show teacher_id_number */}
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
        </>
      );
    }
    if (activeSection === "students") {
      return (
        <>
          <h2>Students</h2>
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
                border: "1px border #ccc",
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
                minWidth: "700px",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Student ID Number</th>
                  <th>Email</th>
                  <th>Course</th>
                  {/* <th>Section</th> */}
                  {/* <th>Year Level</th> */}
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
                    <td>{student.student_id_number || "N/A"}</td>
                    <td>{student.email}</td>
                    <td>{student.course}</td>
                    {/* <td>{student.section}</td> */}
                    {/* <td>{student.year_level || "N/A"}</td> */}
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
        </>
      );
    }
    if (activeSection === "add-grade") {
      return (
        <>
          <h2 style={{
            textAlign: "center",
            color: "#388e3c",
            marginBottom: "24px",
            fontWeight: "bold",
            letterSpacing: "1px",
            fontSize: "2rem"
          }}>
            Add Grade Report Entry
          </h2>
          <div style={{
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <label style={{
              fontWeight: "bold",
              color: "#333",
              fontSize: "1rem",
              marginRight: "12px"
            }}>
              <input
                type="checkbox"
                checked={multiAddMode}
                onChange={() => {
                  setMultiAddMode(!multiAddMode);
                  setSelectedStudents([]);
                  setSelectedTeachers([]);
                  setSelectedStudent("");
                  setSelectedTeacher("");
                }}
                style={{ marginRight: 8, accentColor: "#388e3c" }}
              />
              Enable Multiple Add
            </label>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: "bold", color: "#333", fontSize: "1rem", marginRight: "12px" }}>
              Batch Add via Excel:
              <input
                type="file"
                accept=".xlsx,.xls"
                style={{ marginLeft: 8 }}
                onChange={handleGradeReportExcelUpload}
              />
            </label>
            <div style={{ fontSize: "0.9rem", color: "#888", marginTop: 4 }}>
              Excel columns expected: year_level, term, student_id_number, teacher_id_number, course, section, subject
            </div>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAddingGradeReport(true); // Start loading
              if (multiAddMode) {
                if (
                  selectedTeachers.length === 0 ||
                  selectedYearLevel === "" ||
                  selectedTerm === "" ||
                  selectedStudents.length === 0 ||
                  selectedCourse === "" ||
                  selectedSection === "" ||
                  selectedSubject === ""
                ) {
                  setReportMessage("Please fill out all fields and select at least one student and teacher.");
                  setAddingGradeReport(false); // Stop loading
                  return;
                }
                let totalInserted = 0;
                let totalSkipped = 0;
                for (const studentId of selectedStudents) {
                  for (const teacherId of selectedTeachers) {
                    for (const course of Array.isArray(selectedCourse) ? selectedCourse : [selectedCourse]) {
                      for (const section of Array.isArray(selectedSection) ? selectedSection : [selectedSection]) {
                        for (const subject of Array.isArray(selectedSubject) ? selectedSubject : [selectedSubject]) {
                          // Check for existing grade reports for this combination
                          const { data: existingReports, error: fetchError } = await supabase
                            .from("grade_report")
                            .select("exam_type, subject")
                            .eq("teacher_id", teacherId)
                            .eq("student_id", studentId)
                            .eq("course", course)
                            .eq("section", section)
                            .eq("subject", subject)
                            .eq("term", selectedTerm);

                          if (fetchError) continue;

                          const existingEntries = existingReports
                            ? existingReports.map((r) => `${r.exam_type}-${r.subject}`)
                            : [];
                          const examTypesToInsert = examTypes.filter(
                            (exam) => !existingEntries.includes(`${exam}-${subject}`)
                          );

                          if (examTypesToInsert.length === 0) {
                            totalSkipped++;
                            continue; // All exam types for this student/subject already exist
                          }

                          for (const exam of examTypesToInsert) {
                            const { error } = await supabase.from("grade_report").insert([
                              {
                                teacher_id: teacherId,
                                student_id: studentId,
                                course,
                                section,
                                subject,
                                exam_type: exam,
                                term: selectedTerm,
                                status: "assigned",
                                created_at: new Date().toISOString(),
                              },
                            ]);
                            if (!error) totalInserted++;
                          }
                        }
                      }
                    }
                  }
                }
                setAddingGradeReport(false); // Stop loading
                setReportMessage(
                  `Done adding grade report entries. ${totalInserted} added, ${totalSkipped} skipped (already exist).`
                );
                setSelectedTeachers([]);
                setSelectedStudents([]);
                setSelectedYearLevel("");
                setSelectedTerm("");
                setSelectedCourse("");
                setSelectedSection("");
                setSelectedSubject("");
                setTeacherSearchQuery("");
                setStudentSearchQuery("");
                fetchAssignments();
                return;
              }
              // Single add logic (existing)
              handleAssignGradeReport(e);
            }}
            style={{
              background: "#f9fbe7",
              borderRadius: "16px",
              boxShadow: "0 2px 16px rgba(60, 120, 60, 0.08)",
              padding: "32px 24px",
              maxWidth: "900px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Year Level */}
            <div>
              <label style={{ fontWeight: "bold", color: "#388e3c", marginBottom: 6, display: "block" }}>Year Level</label>
              <select
                value={selectedYearLevel}
                onChange={(e) => {
                  setSelectedYearLevel(e.target.value);
                  setStudentSearchQuery("");
                  setSelectedStudent("");
                  setSelectedStudents([]);
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #bdbdbd",
                  background: "#fff",
                  fontSize: "1rem",
                  marginBottom: "2px"
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
              <label style={{ fontWeight: "bold", color: "#388e3c", marginBottom: 6, display: "block" }}>Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #bdbdbd",
                  background: "#fff",
                  fontSize: "1rem",
                  marginBottom: "2px"
                }}
              >
                <option value="">Select Term</option>
                {termOptions.map((term, idx) => (
                  <option key={idx} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
            {/* Student */}
            <div style={{ position: "relative" }}>
              <label style={{ fontWeight: "bold", color: "#388e3c", marginBottom: 6, display: "block" }}>Student</label>
              {multiAddMode ? (
                <div
                  style={{
                    maxHeight: "140px",
                    overflowY: "auto",
                    border: "1px solid #c8e6c9",
                    background: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 1px 6px rgba(60,120,60,0.07)",
                    width: "100%",
                    position: "relative",
                    zIndex: 11,
                    padding: "6px"
                  }}
                >
                  {filteredStudentsBase.map((student) => (
                    <div key={student.id} style={{ marginBottom: "4px" }}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter((id) => id !== student.id));
                          }
                        }}
                        style={{ marginRight: "8px", accentColor: "#388e3c" }}
                      />
                      {student.username}
                      <span style={{ color: "#888", fontSize: "0.95em", marginLeft: "6px" }}>
                        ({student.student_id_number})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search student by name or number..."
                    value={studentSearchQuery}
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      setSelectedStudent("");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "1rem",
                      border: "1px solid #bdbdbd",
                      borderRadius: "8px",
                      background: "#fff"
                    }}
                  />
                  {studentSearchQuery.trim().length > 0 && (
                    <div
                      style={{
                        maxHeight: "140px",
                        overflowY: "auto",
                        border: "1px solid #c8e6c9",
                        marginTop: "6px",
                        background: "#fff",
                        borderRadius: "8px",
                        boxShadow: "0 1px 6px rgba(60,120,60,0.07)",
                        zIndex: 10,
                        position: "absolute",
                        width: "100%",
                        left: 0
                      }}
                    >
                      {filteredStudentsBase
                        .slice(0, 20)
                        .map((student) => (
                          <div
                            key={student.id}
                            onClick={() => {
                              setSelectedStudent(student.id);
                              setStudentSearchQuery(student.student_id_number || student.username);
                            }}
                            style={{
                              padding: "7px",
                              cursor: "pointer",
                              borderBottom: "1px solid #eee",
                              borderRadius: "6px"
                            }}
                          >
                            {student.username}
                            <span style={{ color: "#888", fontSize: "0.95em", marginLeft: "6px" }}>
                              ({student.student_id_number})
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Teacher */}
            <div style={{ position: "relative" }}>
              <label style={{ fontWeight: "bold", color: "#388e3c", marginBottom: 6, display: "block" }}>Teacher</label>
              {multiAddMode ? (
                <>
                  <input
                    type="text"
                    placeholder="Search teacher by name or number..."
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "1rem",
                      border: "1px solid #bdbdbd",
                      borderRadius: "8px",
                      marginBottom: "6px",
                      background: "#fff"
                    }}
                  />
                  <div
                    style={{
                      maxHeight: "140px",
                      overflowY: "auto",
                      border: "1px solid #c8e6c9",
                      background: "#fff",
                      borderRadius: "8px",
                      boxShadow: "0 1px 6px rgba(60,120,60,0.07)",
                      width: "100%",
                      position: "relative",
                      zIndex: 11,
                      padding: "6px"
                    }}
                  >
                    {filteredTeachers.map((teacher) => (
                      <div key={teacher.id} style={{ marginBottom: "4px" }}>
                        <input
                          type="checkbox"
                          checked={selectedTeachers.includes(teacher.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeachers([...selectedTeachers, teacher.id]);
                            } else {
                              setSelectedTeachers(selectedTeachers.filter((id) => id !== teacher.id));
                            }
                          }}
                          style={{ marginRight: "8px", accentColor: "#388e3c" }}
                        />
                        {teacher.username}
                        <span style={{ color: "#888", fontSize: "0.95em", marginLeft: "6px" }}>
                          ({teacher.teacher_id_number})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search teacher by name or number..."
                    value={teacherSearchQuery}
                    onChange={(e) => {
                      setTeacherSearchQuery(e.target.value);
                      setSelectedTeacher("");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "1rem",
                      border: "1px solid #bdbdbd",
                      borderRadius: "8px",
                      background: "#fff"
                    }}
                  />
                  {teacherSearchQuery.trim().length > 0 && (
                    <div
                      style={{
                        maxHeight: "140px",
                        overflowY: "auto",
                        border: "1px solid #c8e6c9",
                        marginTop: "6px",
                        background: "#fff",
                        borderRadius: "8px",
                        boxShadow: "0 1px 6px rgba(60,120,60,0.07)",
                        zIndex: 10,
                        position: "absolute",
                        width: "100%",
                        left: 0
                      }}
                    >
                      {filteredTeachers
                        .slice(0, 20)
                        .map((teacher) => (
                          <div
                            key={teacher.id}
                            onClick={() => {
                              setSelectedTeacher(teacher.id);
                              setTeacherSearchQuery(teacher.teacher_id_number || teacher.username);
                            }}
                            style={{
                              padding: "7px",
                              cursor: "pointer",
                              borderBottom: "1px solid #eee",
                              borderRadius: "6px"
                            }}
                          >
                            {teacher.username}
                            <span style={{ color: "#888", fontSize: "0.95em", marginLeft: "6px" }}>
                              ({teacher.teacher_id_number})
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Course */}
            <div>
              <label style={{ fontWeight: "bold", color: "#388e3c", marginBottom: 6, display: "block" }}>Course</label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #bdbdbd",
                  background: "#fff",
                  fontSize: "1rem"
                }}
              >
                <option value="">Select Course</option>
                {customCourses.map((courseObj, idx) => (
                  <option key={idx} value={courseObj.course}>
                    {courseObj.course} ({courseObj.year_level})
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label style={{ fontWeight: "bold", color: "#388e3c", marginBottom: 6, display: "block" }}>Section</label>
              {multiAddMode ? (
                <div
                  style={{
                    maxHeight: "140px",
                    overflowY: "auto",
                    border: "1px solid #c8e6c9",
                    background: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 1px 6px rgba(60,120,60,0.07)",
                    width: "100%",
                    position: "relative",
                    zIndex: 11,
                    padding: "6px"
                  }}
                >
                  {availableSections.map((section, idx) => (
                    <div key={idx} style={{ marginBottom: "4px" }}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(selectedSection) ? selectedSection.includes(section) : false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSection(Array.isArray(selectedSection) ? [...selectedSection, section] : [section]);
                          } else {
                            setSelectedSection(Array.isArray(selectedSection) ? selectedSection.filter((s) => s !== section) : []);
                          }
                        }}
                        style={{ marginRight: "8px", accentColor: "#388e3c" }}
                      />
                      {section}
                    </div>
                  ))}
                </div>
              ) : (
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #bdbdbd",
                    background: "#fff",
                    fontSize: "1rem"
                  }}
                >
                  <option value="">Select Section</option>
                  {availableSections.map((section, idx) => (
                    <option key={idx} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Subject */}
            <div>
              <label style={{ fontWeight: "bold", color: "#388e3c", marginBottom: 6, display: "block" }}>Subject</label>
              {multiAddMode ? (
                <div
                  style={{
                    maxHeight: "140px",
                    overflowY: "auto",
                    border: "1px solid #c8e6c9",
                    background: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 1px 6px rgba(60,120,60,0.07)",
                    width: "100%",
                    position: "relative",
                    zIndex: 11,
                    padding: "6px"
                  }}
                >
                  {availableSubjects.map((subject, idx) => (
                    <div key={idx} style={{ marginBottom: "4px" }}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(selectedSubject) ? selectedSubject.includes(subject) : false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubject(Array.isArray(selectedSubject) ? [...selectedSubject, subject] : [subject]);
                          } else {
                            setSelectedSubject(Array.isArray(selectedSubject) ? selectedSubject.filter((s) => s !== subject) : []);
                          }
                        }}
                        style={{ marginRight: "8px", accentColor: "#388e3c" }}
                      />
                      {subject}
                    </div>
                  ))}
                </div>
              ) : (
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #bdbdbd",
                    background: "#fff",
                    fontSize: "1rem"
                  }}
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map((subject, idx) => (
                    <option key={idx} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* Submit */}
            <div style={{ gridColumn: "1/-1", textAlign: "center", marginTop: "12px" }}>
              <button
                type="submit"
                style={{
                  padding: "12px 32px",
                  background: "#388e3c",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(60,120,60,0.09)",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseOver={e => (e.target.style.background = "#2e7031")}
                onMouseOut={e => (e.target.style.background = "#388e3c")}
                disabled={addingGradeReport}
              >
                {addingGradeReport
                  ? "Adding Grade Report Entries..."
                  : multiAddMode
                  ? "Add Multiple Grade Report Entries"
                  : "Add Grade Report Entry"}
              </button>
            </div>
          </form>
          {addingGradeReport && (
            <div style={{
              marginTop: "18px",
              textAlign: "center",
              padding: "12px",
              background: "#fffde7",
              color: "#fbc02d",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "1rem",
              boxShadow: "0 1px 6px rgba(60,120,60,0.07)"
            }}>
              Please wait, adding grade report entries...
            </div>
          )}
          {reportMessage && !addingGradeReport && (
            <div style={{
              marginTop: "18px",
              textAlign: "center",
              padding: "12px",
              background: "#e8f5e9",
              color: "#388e3c",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "1rem",
              boxShadow: "0 1px 6px rgba(60,120,60,0.07)"
            }}>
              {reportMessage}
            </div>
          )}
        </>
      );
    }
    if (activeSection === "history") {
      return (
        <>
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
        </>
      );
    }
    return null;
  };

  // Get the selected course object
  const selectedCourseObj = customCourses.find(
    c =>
      c.course === selectedCourse &&
      c.year_level === selectedYearLevel
  );

  // Get term index
  const termIndex = selectedTerm === "2nd Term" ? 1 : 0;

  // Sections and subjects for selected course/year/term
  const availableSections =
    selectedCourseObj && selectedCourseObj.sections
      ? selectedCourseObj.sections[termIndex] || []
      : [];

  const availableSubjects =
    selectedCourseObj && selectedCourseObj.subjects
      ? selectedCourseObj.subjects[termIndex] || []
      : [];

  return (
    <div
      className="admin-dashboard"
      style={{
        padding: "20px",
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
        fontSize: "0.9rem",
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {/* SIDE NAVBAR */}
      <aside
        style={{
          width: "220px",
          background: "#4CAF50",
          color: "#fff",
          padding: "24px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          minHeight: "100vh",
          boxShadow: "2px 0 8px rgba(0,0,0,0.07)",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 2000,
        }}
      >
        <button
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontWeight: activeSection === "teachers" ? "bold" : "normal",
            fontSize: "1rem",
            cursor: "pointer",
            padding: "12px 24px",
            width: "100%",
            textAlign: "left",
          }}
          onClick={() => setActiveSection("teachers")}
        >
          Teachers
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontWeight: activeSection === "students" ? "bold" : "normal",
            fontSize: "1rem",
            cursor: "pointer",
            padding: "12px 24px",
            width: "100%",
            textAlign: "left",
          }}
          onClick={() => setActiveSection("students")}
        >
          Students
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontWeight: activeSection === "add-grade" ? "bold" : "normal",
            fontSize: "1rem",
            cursor: "pointer",
            padding: "12px 24px",
            width: "100%",
            textAlign: "left",
          }}
          onClick={() => setActiveSection("add-grade")}
        >
          Add Grade Report Entry
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontWeight: activeSection === "history" ? "bold" : "normal",
            fontSize: "1rem",
            cursor: "pointer",
            padding: "12px 24px",
            width: "100%",
            textAlign: "left",
          }}
          onClick={() => setActiveSection("history")}
        >
          Action History
        </button>
        <div style={{ flex: 1 }} />
        <Link to="/adminsetting" style={{ marginLeft: "24px", marginBottom: "24px" }}>
          <img src="/src/img/settingss.png" alt="Settings" className="settings-icon" style={{ height: 28 }} />
        </Link>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: "220px", width: "100%" }}>
        <div style={{ marginTop: "30px" }}>
          {loading ? <p>Loading users...</p> : error ? <p style={{ color: "red" }}>Error: {error}</p> : renderSection()}
        </div>
      </div>

      {showBatchGradeReview && (
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
    onClick={() => setShowBatchGradeReview(false)}
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
      <h2 style={{ marginBottom: 32, fontSize: "2rem" }}>Review Batch Grade Reports</h2>
      {batchGradeReports.map((gr, idx) => {
        // Find student and teacher objects by ID for display
        const studentObj = students.find(s => s.id === gr.student_id);
        const teacherObj = teachers.find(t => t.id === gr.teacher_id);

        // Get the original ID numbers from the Excel row if not found in DB
        const studentIdNumber = studentObj?.student_id_number || gr.student_id_number || "";
        const teacherIdNumber = teacherObj?.teacher_id_number || gr.teacher_id_number || "";

        return (
          <div key={idx} style={{ marginBottom: 32, borderBottom: "1px solid #eee", paddingBottom: "24px" }}>
            <div>
              <strong>Year Level:</strong>
              <input
                type="text"
                value={gr.year_level}
                onChange={e => {
                  const updated = [...batchGradeReports];
                  updated[idx].year_level = e.target.value;
                  setBatchGradeReports(updated);
                }}
                style={{ marginLeft: 12, width: "60%" }}
              />
            </div>
            <div>
              <strong>Term:</strong>
              <input
                type="text"
                value={gr.term}
                onChange={e => {
                  const updated = [...batchGradeReports];
                  updated[idx].term = e.target.value;
                  setBatchGradeReports(updated);
                }}
                style={{ marginLeft: 12, width: "60%" }}
              />
            </div>
            <div>
              <strong>Student ID Number:</strong>
              <input
                type="text"
                value={gr.student_id_number}
                onChange={e => {
                  const updated = [...batchGradeReports];
                  updated[idx].student_id_number = e.target.value;
                  const foundStudent = students.find(s => s.student_id_number === e.target.value);
                  updated[idx].student_id = foundStudent ? foundStudent.id : "";
                  setBatchGradeReports(updated);
                }}
                style={{ marginLeft: 12, width: "60%" }}
              />
              {gr.student_id === "" && (
    <span style={{ color: "red", marginLeft: 12 }}>
      Not found in database!
    </span>
  )}
              {studentObj && (
                <span style={{ color: "#888", marginLeft: 12 }}>
                  {studentObj.username}
                </span>
              )}
            </div>
            <div>
              <strong>Teacher ID Number:</strong>
              <input
                type="text"
                value={gr.teacher_id_number}
                onChange={e => {
                  const updated = [...batchGradeReports];
                  updated[idx].teacher_id_number = e.target.value;
                  const foundTeacher = teachers.find(t => t.teacher_id_number === e.target.value);
                  updated[idx].teacher_id = foundTeacher ? foundTeacher.id : "";
                  setBatchGradeReports(updated);
                }}
                style={{ marginLeft: 12, width: "60%" }}
              />
              {gr.teacher_id === "" && (
    <span style={{ color: "red", marginLeft: 12 }}>
      Not found in database!
    </span>
  )}
              {teacherObj && (
                <span style={{ color: "#888", marginLeft: 12 }}>
                  {teacherObj.username}
                </span>
              )}
            </div>
            <div>
              <strong>Course:</strong>
              <input
                type="text"
                value={gr.course}
                onChange={e => {
                  const updated = [...batchGradeReports];
                  updated[idx].course = e.target.value;
                  setBatchGradeReports(updated);
                }}
                style={{ marginLeft: 12, width: "60%" }}
              />
            </div>
            <div>
              <strong>Section:</strong>
              <input
                type="text"
                value={gr.section}
                onChange={e => {
                  const updated = [...batchGradeReports];
                  updated[idx].section = e.target.value;
                  setBatchGradeReports(updated);
                }}
                style={{ marginLeft: 12, width: "60%" }}
              />
            </div>
            <div>
              <strong>Subject:</strong>
              <input
                type="text"
                value={gr.subject}
                onChange={e => {
                  const updated = [...batchGradeReports];
                  updated[idx].subject = e.target.value;
                  setBatchGradeReports(updated);
                }}
                style={{ marginLeft: 12, width: "60%" }}
              />
            </div>
            <button
              style={{ marginTop: 8, background: "#dc3545", color: "#fff", borderRadius: "6px", padding: "6px 18px", border: "none", cursor: "pointer" }}
              onClick={() => {
                const updated = batchGradeReports.filter((_, i) => i !== idx);
                setBatchGradeReports(updated);
              }}
            >
              Remove
            </button>
          </div>
        );
      })}
      <button
        style={{
          background: "#28a745",
          fontSize: "1.2rem",
          padding: "14px 32px",
          marginTop: 24,
          borderRadius: "10px",
          border: "none",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
        onClick={async () => {
          setBatchGradeSaving(true);
          setBatchGradeSaveError("");
          try {
            // Before saving, filter out invalid entries
            const validBatch = batchGradeReports
              .filter(gr => gr.student_id && gr.teacher_id && gr.course && gr.section && gr.subject)
              .map(gr => ({
                teacher_id: gr.teacher_id,
                student_id: gr.student_id,
                course: gr.course,
                section: gr.section,
                subject: gr.subject,
                exam_type: gr.exam_type || "Prelim",
                term: gr.term,
                status: gr.status || "assigned",
                created_at: gr.created_at || new Date().toISOString(),
              }));

    if (validBatch.length === 0) {
      setBatchGradeSaveError("No valid entries to save. Check your Excel for missing or incorrect IDs.");
      setBatchGradeSaving(false);
      return;
    }

    console.log("Saving batch:", validBatch);

    const { error } = await supabase.from("grade_report").insert(validBatch);
    if (error) throw error;

    // Show success message
    setBatchGradeSaveError(""); // Clear any previous error
    setShowBatchGradeReview(false);
    setBatchGradeReports([]);
    await fetchAssignments();
    setReportMessage("Batch grade reports successfully added!"); // <-- Add this line
          } catch (err) {
            setBatchGradeSaveError("Failed to save batch. Please try again.");
          } finally {
            setBatchGradeSaving(false);
          }
        }}
        disabled={batchGradeSaving}
      >
        {batchGradeSaving ? "Saving..." : "Done & Save All"}
      </button>
      {batchGradeSaveError && (
        <div style={{ color: "#dc3545", fontWeight: "bold", marginTop: 16 }}>{batchGradeSaveError}</div>
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
        onClick={() => setShowBatchGradeReview(false)}
      >
        Close
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default Admin;
