import "/src/components/style.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const GradeReport = () => {
  // Data arrays
  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
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
  const examTypes = ["Prelim", "Midterm", "Pre-Final", "Final"];

  // State variables for selections
  const [selectedYearLevel, setSelectedYearLevel] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Favorite filter toggles and favorites
  const [filterFavoriteCourses, setFilterFavoriteCourses] = useState(false);
  const [filterFavoriteSections, setFilterFavoriteSections] = useState(false);
  const [filterFavoriteSubjects, setFilterFavoriteSubjects] = useState(false);
  const [favorites, setFavorites] = useState({
    courses: [],
    sections: [],
    subjects: [],
  });

  // User type and teacher id
  const [userType, setUserType] = useState("teacher"); // Default to teacher
  const [teacherId, setTeacherId] = useState(null);

  // State for fetched grade report entries
  const [gradeReports, setGradeReports] = useState([]);
  const [loadingGradeReports, setLoadingGradeReports] = useState(false);

  // New state variables for data analysis
  const [averageScore, setAverageScore] = useState(null);
  const [passRate, setPassRate] = useState(null);
  const [topScorer, setTopScorer] = useState(null);
  const [scoreDistribution, setScoreDistribution] = useState([]);
  const [questionStats, setQuestionStats] = useState([]);
  const [lowestScore, setLowestScore] = useState(null);
  const [highestScore, setHighestScore] = useState(null);
  const [medianScore, setMedianScore] = useState(null);
  const [perfectCount, setPerfectCount] = useState(0);
  const [failCount, setFailCount] = useState(0);

  // New state variables for editing scores
  const [editingScoreId, setEditingScoreId] = useState(null); // Track the row being edited
  const [newScore, setNewScore] = useState(""); // Track the new score being entered

  // New state variables for database courses, sections, and subjects
  const [dbCourses, setDbCourses] = useState([]);
  const [dbSections, setDbSections] = useState([]);
  const [dbSubjects, setDbSubjects] = useState([]);

  // Load filter settings from localStorage on mount
  useEffect(() => {
    const coursesFilter = localStorage.getItem("filterFavoriteCourses") === "true";
    const sectionsFilter = localStorage.getItem("filterFavoriteSections") === "true";
    const subjectsFilter = localStorage.getItem("filterFavoriteSubjects") === "true";
    setFilterFavoriteCourses(coursesFilter);
    setFilterFavoriteSections(sectionsFilter);
    setFilterFavoriteSubjects(subjectsFilter);
  }, []);

  // Update localStorage when filter toggles change
  useEffect(() => {
    localStorage.setItem("filterFavoriteCourses", filterFavoriteCourses);
  }, [filterFavoriteCourses]);

  useEffect(() => {
    localStorage.setItem("filterFavoriteSections", filterFavoriteSections);
  }, [filterFavoriteSections]);

  useEffect(() => {
    localStorage.setItem("filterFavoriteSubjects", filterFavoriteSubjects);
  }, [filterFavoriteSubjects]);

  // Filter courses based on search query and favorite filter
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.toLowerCase().includes(searchQuery.toLowerCase());
    const isFav = favorites.courses.includes(course);
    return matchesSearch && (!filterFavoriteCourses || isFav);
  });

  // Similarly filter sections and subjects if favorite filter is active
  const filteredSections = defaultSections.filter((section) => {
    const isFav = favorites.sections.includes(section);
    return !filterFavoriteSections || isFav;
  });

  const filteredSubjects = subjects.filter((subject) => {
    const isFav = favorites.subjects.includes(subject);
    return !filterFavoriteSubjects || isFav;
  });

  // Fetch teacher favorites from database
  const fetchFavorites = async (uid) => {
    const { data, error } = await supabase
      .from("favorites")
      .select("type, item")
      .eq("teacher_id", uid);
    if (error) {
      console.error("Error fetching favorites:", error);
      return;
    }
    const favs = { courses: [], sections: [], subjects: [] };
    data.forEach((entry) => {
      if (entry.type === "course") {
        favs.courses.push(entry.item);
      } else if (entry.type === "section") {
        favs.sections.push(entry.item);
      } else if (entry.type === "subject") {
        favs.subjects.push(entry.item);
      }
    });
    setFavorites(favs);
  };

  // Get teacher id and favorites on mount
  useEffect(() => {
    const getTeacherData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTeacherId(user.id);
        fetchFavorites(user.id);
      } else {
        console.error("User not authenticated");
      }
    };
    getTeacherData();
  }, []);

  // Toggle favorite status for an item
  const toggleFavorite = async (type, item) => {
    if (!teacherId) {
      console.error("Teacher not identified");
      return;
    }
    const isFavorite = favorites[`${type}s`].includes(item);
    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("teacher_id", teacherId)
        .eq("type", type)
        .eq("item", item);
      if (error) {
        console.error("Error removing favorite:", error);
        return;
      }
      setFavorites((prev) => ({
        ...prev,
        [`${type}s`]: prev[`${type}s`].filter((fav) => fav !== item),
      }));
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert([{ teacher_id: teacherId, type, item }]);
      if (error) {
        console.error("Error adding favorite:", error);
        return;
      }
      setFavorites((prev) => ({
        ...prev,
        [`${type}s`]: [...prev[`${type}s`], item],
      }));
    }
  };

  // Fetch grade reports and perform data analysis
  const fetchGradeReports = async () => {
    if (
      selectedYearLevel &&
      selectedTerm &&
      selectedCourse &&
      selectedSection &&
      selectedSubject &&
      selectedExam
    ) {
      setLoadingGradeReports(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        setLoadingGradeReports(false);
        return;
        
      }

      
      // For teacher view, fetch grade reports that match the selected filters
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
          score,
          status,
          term,
          created_at,
          student:students(username, year_level, student_id_number) // <-- Added student_id_number
        `)
        .eq("course", selectedCourse.name)
        .eq("section", selectedSection)
        .eq("subject", selectedSubject)
        .eq("exam_type", selectedExam)
        .eq("term", selectedTerm)
        .eq("teacher_id", teacherId);

      if (error) {
        console.error("Error fetching grade reports:", error);
        setGradeReports([]);
      } else {
        // Remove year level filtering so all students for the selected course/section/subject/exam/term are shown
        const sorted = (data || []).sort((a, b) => {
          const scoreA = a.score !== null ? a.score : 0;
          const scoreB = b.score !== null ? b.score : 0;
          return scoreB - scoreA;
        });
        setGradeReports(sorted);

        // Perform data analysis
        analyzeData(data || []);
      }
      setLoadingGradeReports(false);
    }
  };

  // Enhanced data analysis function
  const analyzeData = (reports) => {
    if (reports.length === 0) {
      setAverageScore(null);
      setPassRate(null);
      setTopScorer(null);
      setScoreDistribution([]);
      setQuestionStats([]);
      setLowestScore(null);
      setHighestScore(null);
      setMedianScore(null);
      setPerfectCount(0);
      setFailCount(0);
      return;
    }

    // Calculate average score
    const scores = reports.map((report) => report.score || 0);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const avgScore = (totalScore / reports.length).toFixed(2);
    setAverageScore(avgScore);

    // Calculate pass rate (score >= 75)
    const passingCount = scores.filter((score) => score >= 75).length;
    const passPercentage = ((passingCount / reports.length) * 100).toFixed(2);
    setPassRate(passPercentage);

    // Find top scorers (handle ties)
    const maxScore = Math.max(...scores);
    const topScorers = reports
      .filter((report) => report.score === maxScore)
      .map((report) => report.student?.username || "N/A");
    setTopScorer(topScorers.join(", "));

    // Calculate score distribution
    const distribution = [0, 0, 0, 0]; // 0-25, 26-50, 51-75, 76-100
    scores.forEach((score) => {
      if (score <= 25) distribution[0]++;
      else if (score <= 50) distribution[1]++;
      else if (score <= 75) distribution[2]++;
      else distribution[3]++;
    });
    setScoreDistribution(distribution);

    // Lowest, highest, median, perfect, fail count
    setLowestScore(Math.min(...scores));
    setHighestScore(maxScore);
    const sortedScores = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sortedScores.length / 2);
    setMedianScore(
      sortedScores.length % 2 === 0
        ? ((sortedScores[mid - 1] + sortedScores[mid]) / 2).toFixed(2)
        : sortedScores[mid].toFixed(2)
    );
    setPerfectCount(scores.filter((score) => score === 100).length);
    setFailCount(scores.filter((score) => score < 75).length);

    // Per-question analysis (assuming each report has answers: { [questionNumber]: true/false })
    // If you don't have answers, skip this part or adjust to your schema
    const questionStats = [];
    if (reports[0]?.answers) {
      const questionNumbers = Object.keys(reports[0].answers);
      questionNumbers.forEach((qNum) => {
        let right = 0, wrong = 0;
        reports.forEach((report) => {
          if (report.answers[qNum]) right++;
          else wrong++;
        });
        questionStats.push({
          question: qNum,
          right,
          wrong,
          needsReview: wrong > right // If more students got it wrong
        });
      });
      setQuestionStats(questionStats);
    } else {
      setQuestionStats([]);
    }
  };
  

  // Fetch grade reports whenever selections change
  useEffect(() => {
    fetchGradeReports();
  }, [
    selectedYearLevel,
    selectedTerm,
    selectedCourse,
    selectedSection,
    selectedSubject,
    selectedExam,
  ]);

  // Function to handle score editing
  const handleEditScore = (id, currentScore) => {
    setEditingScoreId(id);
    setNewScore(currentScore);
  };

  // Function to save the updated score and recalculate rankings
const handleSaveScore = async (id) => {
  const updatedReports = gradeReports.map((report) =>
    report.id === id ? { ...report, score: parseFloat(newScore) } : report
  );

  // Update the score in the database
  const { error } = await supabase
    .from("grade_report")
    .update({ score: parseFloat(newScore) })
    .eq("id", id);

  if (error) {
    console.error("Error updating score:", error);
    alert("Failed to update the score. Please try again.");
  } else {
    // Recalculate rankings
    const sortedReports = updatedReports.sort((a, b) => (b.score || 0) - (a.score || 0));
    const updatedRanks = [];
    if (sortedReports.length > 0) {
      updatedRanks[0] = 1;
      for (let i = 1; i < sortedReports.length; i++) {
        if (sortedReports[i].score === sortedReports[i - 1].score) {
          updatedRanks[i] = updatedRanks[i - 1];
        } else {
          updatedRanks[i] = updatedRanks[i - 1] + 1;
        }
      }
    }

    // Update state with new rankings and scores
    setGradeReports(sortedReports);
    setRanks(updatedRanks); // Update the ranks state
  }

  // Close edit mode
  setEditingScoreId(null);
  setNewScore("");
};

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingScoreId(null);
    setNewScore("");
  };

  // Fetch courses, sections, and subjects from Supabase on mount
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedYearLevel || !selectedTerm) return; // Only fetch when both are selected
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("year_level", selectedYearLevel);

      if (!error && data) {
        setDbCourses(data.map(c => c.course));
        // Find the course object for the selected course
        const selectedCourseObj = data.find(c => c.course === selectedCourse?.name);
        // If you want to filter sections/subjects by term:
        const termIndex = selectedTerm === "1st Term" ? 0 : 1;
        setDbSections(selectedCourseObj ? selectedCourseObj.sections[termIndex] : []);
        setDbSubjects(selectedCourseObj ? selectedCourseObj.subjects[termIndex] : []);
      }
    };
    fetchCourses();
  }, [selectedYearLevel, selectedTerm, selectedCourse]);

  // Download PDF report
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Grade Report", 105, 20, { align: "center" });

    // Subheader
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(60, 179, 113); // Modern green
    doc.text(
      `${selectedCourse?.name || ""} | ${selectedSection || ""} | ${selectedSubject || ""} | ${selectedExam || ""}`,
      105,
      28,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);

    // Table Header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(230, 247, 237); // Light green
    doc.rect(15, 38, 180, 10, "F");
    doc.text("Rank", 20, 45);
    doc.text("Name", 40, 45);
    doc.text("Student ID", 80, 45);
    doc.text("Score", 120, 45);
    doc.text("Status", 150, 45);

    // Table Rows
    let y = 55;
    doc.setFont("helvetica", "normal");
    gradeReports.forEach((report, idx) => {
      // Alternate row color
      if (idx % 2 === 0) doc.setFillColor(255, 255, 255);
      else doc.setFillColor(245, 245, 245);
      doc.rect(15, y - 7, 180, 9, "F");

      // Data
      doc.text(String(idx + 1), 20, y);
      doc.text(
        report.student?.username || report.student_id || "N/A",
        40,
        y
      );
      doc.text(
        report.student?.student_id_number || "N/A",
        80,
        y
      );
      doc.text(
        report.score !== null ? String(report.score) : "N/A",
        120,
        y
      );
      doc.setTextColor(report.score < 75 ? 220 : 60, report.score < 75 ? 20 : 179, report.score < 75 ? 60 : 113);
      doc.text(report.score < 75 ? "Failed" : "Passed", 150, y);
      doc.setTextColor(0, 0, 0);
      y += 10;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    // Data Analysis Section
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Summary", 15, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    y += 8;
    doc.text(`Average Score: ${averageScore || "N/A"}`, 15, y);
    doc.text(`Pass Rate: ${passRate ? `${passRate}%` : "N/A"}`, 70, y);
    doc.text(`Top Scorer: ${topScorer || "N/A"}`, 130, y);

    // Certification Section
    y += 20;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(13);
    doc.text(
      "This is to certify that the grades listed above are accurate and official.",
      15,
      y
    );
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Confirmed by:", 15, y);
    doc.line(45, y + 1, 120, y + 1); // Signature line
    y += 10;
    doc.text("Professor's Signature", 50, y);

    // Save PDF
    doc.save("grade-report.pdf");
  };

  return (
    <div className="dashboard-container">
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
            GRADE REPORT
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link to="/scanExam" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>
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
          <Link to="/gradeReport" className="active" style={{ color: "#fff", textDecoration: "underline", fontWeight: 700 }}>
            <img src="/src/img/ReportGrade.png" alt="Grade Report" style={{ width: "28px", verticalAlign: "middle", marginRight: "6px" }} />
            Grade Report
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="main-content" style={{ marginTop: "84px", padding: "20px" }}>
        {selectedYearLevel === null ? (
          <div className="year-level-selection">
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Select Year Level</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
              {yearLevels.map((level, index) => (
                <div
                  key={index}
                  className="year-level-folder"
                  onClick={() => setSelectedYearLevel(level)}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    width: "150px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    padding: "10px",
                    background: "#f9f9f9",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  <img src="/src/img/folder1.png" alt="folder" style={{ width: "80px", height: "80px", marginBottom: "10px" }} />
                  <p>{level}</p>
                </div>
              ))}
            </div>
          </div>
        ) : !selectedTerm ? (
          <div className="term-selection">
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Select Term</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
              {terms.map((term, index) => (
                <div
                  key={index}
                  className="term-folder"
                  onClick={() => setSelectedTerm(term)}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    width: "150px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    padding: "10px",
                    background: "#f9f9f9",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  <img src="/src/img/folder1.png" alt="folder" style={{ width: "80px", height: "80px", marginBottom: "10px" }} />
                  <p>{term}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button onClick={() => setSelectedYearLevel(null)}>Back</button>
            </div>
          </div>
        ) : !selectedCourse ? (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <button onClick={() => setSelectedTerm(null)}>Back</button>
              <button onClick={() => setFilterFavoriteCourses(!filterFavoriteCourses)} style={{ marginLeft: "10px" }}>
                {filterFavoriteCourses ? "Show All" : "Show Favorites Only"}
              </button>
            </div>
            <div className="course-selection">
              <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Select Course</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
                {dbCourses.map((course, index) => (
                  <div
                    key={index}
                    className="course-folder"
                    style={{ cursor: "pointer", textAlign: "center", position: "relative" }}
                  >
                    <img
                      src="/src/img/folder1.png"
                      alt="folder"
                      style={{ width: "100px", height: "100px" }}
                      onClick={() => setSelectedCourse({ name: course, id: index })}
                    />
                    <p>{course}</p>
                    {/* ...favorite logic... */}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : !selectedSection ? (
          <div className="course-content">
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <button onClick={() => setSelectedCourse(null)}>Back</button>
              <button onClick={() => setFilterFavoriteSections(!filterFavoriteSections)} style={{ marginLeft: "10px" }}>
                {filterFavoriteSections ? "Show All" : "Show Favorites Only"}
              </button>
            </div>
            <h2 style={{ textAlign: "center" }}>{selectedCourse.name}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", marginTop: "20px" }}>
              {dbSections.map((section, index) => (
                <div
                  key={index}
                  className="section-folder"
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    position: "relative",
                    width: "150px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    padding: "10px",
                    background: "#f9f9f9",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onClick={() => setSelectedSection(section)}
                >
                  <img src="/src/img/folder1.png" alt="folder" style={{ width: "80px", height: "80px", marginBottom: "10px" }} />
                  <p>{section}</p>
                  <img
                    src="/src/img/favourite.png"
                    alt="favorite"
                    style={{
                      width: "20px",
                      height: "20px",
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      cursor: "pointer",
                      opacity: favorites.sections.includes(section) ? 1 : 0.3,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite("section", section);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : !selectedSubject ? (
          <div className="subject-selection">
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <button onClick={() => setSelectedSection(null)}>Back</button>
              <button onClick={() => setFilterFavoriteSubjects(!filterFavoriteSubjects)} style={{ marginLeft: "10px" }}>
                {filterFavoriteSubjects ? "Show All" : "Show Favorites Only"}
              </button>
            </div>
            <h2 style={{ textAlign: "center" }}>
              {selectedCourse.name} - {selectedSection}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", marginTop: "20px" }}>
              {dbSubjects.map((subject, index) => (
                <div
                  key={index}
                  className="subject-folder"
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    position: "relative",
                    width: "150px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    padding: "10px",
                    background: "#f9f9f9",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onClick={() => setSelectedSubject(subject)}
                >
                  <img src="/src/img/folder1.png" alt="folder" style={{ width: "80px", height: "80px", marginBottom: "10px" }} />
                  <p>{subject}</p>
                  <img
                    src="/src/img/favourite.png"
                    alt="favorite"
                    style={{
                      width: "20px",
                      height: "20px",
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      cursor: "pointer",
                      opacity: favorites.subjects.includes(subject) ? 1 : 0.3,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite("subject", subject);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : !selectedExam ? (
          <div className="exam-selection">
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <button onClick={() => setSelectedSubject(null)}>Back</button>
            </div>
            <h2 style={{ textAlign: "center" }}>
              {selectedCourse.name} - {selectedSection} - {selectedSubject}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", marginTop: "20px" }}>
              {examTypes.map((exam, index) => (
                <div
                  key={index}
                  className="exam-folder"
                  onClick={() => setSelectedExam(exam)}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    width: "150px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    padding: "10px",
                    background: "#f9f9f9",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  <img src="/src/img/folder1.png" alt="folder" style={{ width: "80px", height: "80px", marginBottom: "10px" }} />
                  <p>{exam}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="student-list">
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <button onClick={() => setSelectedExam(null)}>Back</button>
            </div>
            <h2 style={{ textAlign: "center" }}>
              {selectedCourse.name} - {selectedSection} - {selectedSubject} - {selectedExam}
            </h2>
            {loadingGradeReports ? (
              <p style={{ textAlign: "center" }}>Loading grade reports...</p>
            ) : gradeReports.length === 0 ? (
              <p style={{ textAlign: "center" }}>No grade reports found.</p>
            ) : (
              (() => {
                const ranks = [];
                if (gradeReports.length > 0) {
                  ranks[0] = 1;
                  for (let i = 1; i < gradeReports.length; i++) {
                    if (gradeReports[i].score === gradeReports[i - 1].score) {
                      ranks[i] = ranks[i - 1];
                    } else {
                      ranks[i] = ranks[i - 1] + 1;
                    }
                  }
                }
                return (
                  <>
                    {/* Data Analysis Section */}
                    <div
                      style={{
                        marginBottom: "30px",
                        padding: "20px",
                        backgroundColor: "#f9f9f9",
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <h2
                        style={{
                          textAlign: "center",
                          marginBottom: "20px",
                          fontSize: "24px",
                          color: "#333",
                        }}
                      >
                        Data Analysis
                      </h2>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-around",
                          flexWrap: "wrap",
                          gap: "20px",
                        }}
                      >
                        {/* Average Score */}
                        <div
                          style={{
                            flex: "1 1 200px",
                            textAlign: "center",
                            padding: "15px",
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <img
                            src="/src/img/Average.png"
                            alt="Average Score"
                            style={{ width: "50px", marginBottom: "10px" }}
                          />
                          <h3 style={{ fontSize: "18px", color: "#555" }}>Average Score</h3>
                          <p
                            style={{
                              fontSize: "20px",
                              fontWeight: "bold",
                              color: averageScore >= 75 ? "#4CAF50" : "red", // Green if >= 75, Red otherwise
                            }}
                          >
                            {averageScore || "N/A"}
                          </p>
                        </div>

                        {/* Pass Rate */}
                        <div
                          style={{
                            flex: "1 1 200px",
                            textAlign: "center",
                            padding: "15px",
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <img
                            src="/src/img/PassRate.png"
                            alt="Pass Rate"
                            style={{ width: "50px", marginBottom: "10px" }}
                          />
                          <h3 style={{ fontSize: "18px", color: "#555" }}>Pass Rate</h3>
                          <p
                            style={{
                              fontSize: "20px",
                              fontWeight: "bold",
                              color: passRate >= 75 ? "#4CAF50" : "red", // Green if >= 75%, Red otherwise
                            }}
                          >
                            {passRate ? `${passRate}%` : "N/A"}
                          </p>
                        </div>

                        {/* Top Scorer */}
                        <div
                          style={{
                            flex: "1 1 200px",
                            textAlign: "center",
                            padding: "15px",
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <img
                            src="/src/img/TopScorer.png"
                            alt="Top Scorer"
                            style={{ width: "50px", marginBottom: "10px" }}
                          />
                          <h3 style={{ fontSize: "18px", color: "#555" }}>Top Scorer</h3>
                          <p
                            style={{
                              fontSize: "20px",
                              fontWeight: "bold",
                              color: "#4CAF50",
                            }}
                          >
                            {topScorer || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Notice Section */}
                      {(averageScore < 75 || passRate < 75) && (
                        <div
                          style={{
                            marginTop: "20px",
                            padding: "15px",
                            backgroundColor: "#ffe6e6",
                            borderRadius: "8px",
                            border: "1px solid red",
                            textAlign: "center",
                          }}
                        >
                          <h3 style={{ color: "red", fontWeight: "bold" }}>Notice:</h3>
                          <p style={{ fontSize: "16px", color: "#333" }}>
                            {averageScore < 75 &&
                              "The average score is below the passing threshold of 75. Additional support may be required."}
                            {averageScore < 75 && passRate < 75 && <br />}
                            {passRate < 75 &&
                              "The pass rate is below the expected 75%. Consider reviewing the exam or providing additional guidance."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Grade Reports Table */}
                    <table
                      id="grade-report-table"
                      border="1"
                      cellPadding="8"
                      cellSpacing="0"
                      style={{ margin: "0 auto", width: "80%", textAlign: "center" }}
                    >
                      <thead>
                        <tr>
                          <th style={{ textAlign: "center" }}>Top</th>
                          <th style={{ textAlign: "center" }}>Name</th>
                          <th style={{ textAlign: "center" }}>Student ID Number</th> {/* <-- Added column */}
                          <th style={{ textAlign: "center" }}>Exam</th>
                          <th style={{ textAlign: "center" }}>Score</th>
                          <th style={{ textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradeReports.map((report, index) => (
                          <tr
                            key={report.id}
                            style={{
                              backgroundColor: report.score < 75 ? "rgba(255, 0, 0, 0.3)" : "transparent",
                            }}
                          >
                            <td style={{ textAlign: "center" }}>
                              {/* ...existing trophy logic... */}
                              {ranks[index] === 1 ? (
                                <img src="/src/img/gold-trophy.png" alt="Gold Trophy" style={{ width: "20px" }} />
                              ) : ranks[index] === 2 ? (
                                <img src="/src/img/silver-trophy.png" alt="Silver Trophy" style={{ width: "20px" }} />
                              ) : ranks[index] === 3 ? (
                                <img src="/src/img/bronze-trophy.png" alt="Bronze Trophy" style={{ width: "20px" }} />
                              ) : (
                                ranks[index]
                              )}
                            </td>
                            <td
                              style={{
                                textAlign: "center",
                                color: report.score < 75 ? "red" : "black",
                              }}
                            >
                              {report.student && report.student.username ? report.student.username : report.student_id}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {report.student && report.student.student_id_number
                                ? report.student.student_id_number
                                : "N/A"}
                            </td>
                            <td style={{ textAlign: "center" }}>{report.exam_type}</td>
                            <td style={{ textAlign: "center", fontWeight: "bold" }}>
                              {editingScoreId === report.id ? (
                                <input
                                  type="number"
                                  value={newScore}
                                  onChange={(e) => setNewScore(e.target.value)}
                                  style={{
                                    width: "60px",
                                    padding: "5px",
                                    fontSize: "14px",
                                    textAlign: "center",
                                  }}
                                />
                              ) : (
                                report.score !== null ? report.score : "N/A"
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {/* ...existing edit/save/cancel logic... */}
                              {editingScoreId === report.id ? (
                                <>
                                  <button
                                    onClick={() => handleSaveScore(report.id)}
                                    style={{
                                      marginRight: "5px",
                                      padding: "5px 10px",
                                      backgroundColor: "#4CAF50",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "5px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    style={{
                                      padding: "5px 10px",
                                      backgroundColor: "#f44336",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "5px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleEditScore(report.id, report.score)}
                                  style={{
                                    padding: "5px 10px",
                                    backgroundColor: "#4CAF50",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Download PDF Button */}
                    <button
                      onClick={handleDownloadPDF}
                      style={{
                        margin: "20px auto",
                        display: "block",
                        padding: "10px 20px",
                        backgroundColor: "#4CAF50",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Download Grade Report as PDF
                    </button>

                    {/* IMPORTANT NOTICE */}
                    <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
                      <h3 style={{ color: "#d32f2f", textAlign: "center", marginBottom: "10px" }}>IMPORTANT NOTICE:</h3>
                      <ul style={{ lineHeight: "1.8", fontSize: "14px", color: "#333" }}>
                        <li>Students who receive red marks have failed and require additional support from their teacher.</li>
                        <li>The passing score for this exam is 75 to 100 out of a possible 100.</li>
                        <li>Teachers should congratulate students who pass to encourage further growth.</li>
                        <li>Disclosure of individual student ranks is at the teacher’s discretion.</li>
                        <li>If a section fails to meet the required pass rate, instructors should provide targeted support to that section.</li>
                        <li>If a section’s average score falls below the expected benchmark, tailored instructional strategies should be implemented.</li>
                      </ul>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeReport;
