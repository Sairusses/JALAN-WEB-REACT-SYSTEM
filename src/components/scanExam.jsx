import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ScanExam = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // get id either from navigation or query param (for reloads)
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const id = location.state?.id || queryParams.get("id");
  const maxScore = location.state?.maxScore || 0;

  const [examDetails, setExamDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      alert("No exam ID found. Please return to Answer Sheet.");
      return;
    }

    const fetchExamDetails = async () => {
      const { data, error } = await supabase
        .from("answer_keys")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("Failed to load exam details.");
        return;
      }

      setExamDetails(data);
      setLoading(false);
    };

    fetchExamDetails();
  }, [id, navigate]);

  if (loading) return <p>Loading exam details...</p>;
  if (!examDetails) return <p>No exam details found.</p>;

  const {
    exam_code,
    reference,
    year_level,
    term,
    course,
    section,
    subject,
    exam_type,
  } = examDetails;

  return (
    <div>
      <h1>Scan Exam</h1>
      <p><b>Exam Code:</b> {exam_code}</p>
      <p><b>Reference:</b> {reference}</p>
      <p><b>Year Level:</b> {year_level}</p>
      <p><b>Term:</b> {term}</p>
      <p><b>Course:</b> {course}</p>
      <p><b>Section:</b> {section}</p>
      <p><b>Subject:</b> {subject}</p>
      <p><b>Exam Type:</b> {exam_type}</p>
      <p><b>Max Score:</b> {maxScore}</p>
    </div>
  );
};

export default ScanExam;
