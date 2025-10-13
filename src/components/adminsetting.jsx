import "/src/components/style.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "/src/supabaseClient";

const AdminSetting = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("about");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    console.log("User logged out");
    navigate("/login");
  };

  return (
    <div>
      {/* Back button to navigate to admin dashboard */}
      <Link to="/admin-home">
        <div className="back-container">
          <img src="/src/img/back.png" alt="back" className="back" />
        </div>
      </Link>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <button onClick={() => setActiveTab("about")}>About Jalan</button>
          <button onClick={() => setActiveTab("help")}>Help</button>
          <button onClick={handleLogout}>Logout</button>
        </div>

        <div className="settings-content">
          {activeTab === "about" && (
            <div className="about-section">
              <h2>About Jalan</h2>
              <p>
                JALAN: A PROGRESSIVE WEB APPLICATION BASED EXAM CHECKER WITH REAL TIME FEEDBACK SCORE AND DATA ANALYSIS FOR COLLEGE OF ST. CATHERINE QUEZON CITY
              </p>
              <p>
                JALAN is a modern, web-based examination system designed to streamline the assessment process through automation and real-time data analysis. By integrating with a Scantron machine, JALAN processes scanned exam sheets and delivers instant, accurate feedback—eliminating the inefficiencies and errors of traditional manual grading. Drawing on findings by Ronnel C. et al. (2021), which demonstrated that Optical Mark Recognition (OMR) systems dramatically improve grading speed and accuracy compared to manual methods, JALAN harnesses these benefits to ensure reliable and efficient evaluation. Moreover, the system incorporates advanced technologies—such as Optical Character Recognition (OCR) and sentence embedding (Nithin, Y. et al., 2021)—to automatically assess both objective and descriptive answers, thereby enhancing the overall fairness and precision of academic assessments. Designed specifically for the College of St. Catherine Quezon City, JALAN not only automates the grading process but also provides educators with valuable analytics. These insights support data-driven decision-making, helping teachers to identify learning trends and improve pedagogical strategies. Ultimately, JALAN represents a significant innovation in examination management, reducing manual workload while ensuring that students receive prompt and accurate feedback to foster a more effective learning environment.
              </p>
            </div>
          )}

          {activeTab === "help" && (
            <div className="help-section">
              <h2>Help</h2>
              <p>
                This is a placeholder for the Help section. Content to be added later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSetting;
