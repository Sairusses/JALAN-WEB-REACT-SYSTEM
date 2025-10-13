import "/src/components/style.css";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "/src/supabaseClient";

const Setting = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("about");
  const [user, setUser] = useState(null);

  // Fetch user info from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    console.log("User logged out");
    navigate("/login");
  };

  return (
    <div style={{ background: "#f7f7f7", minHeight: "100vh" }}>
      {/* TOP NAVBAR */}
      <nav
        style={{
          width: "100%",
          height: "64px",
          background: "#54b948",
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
          <Link to="/Custom">
            <img src="/src/img/house.png" alt="Back" style={{ width: "32px", marginRight: "12px", cursor: "pointer" }} />
          </Link>
          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "22px", letterSpacing: "1px" }}>
            SETTINGS
          </span>
        </div>
      </nav>

      <div
        className="settings-container"
        style={{
          display: "flex",
          marginTop: "84px",
          maxWidth: "900px",
          marginLeft: "auto",
          marginRight: "auto",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px #0001",
          minHeight: "500px",
        }}
      >
        {/* Sidebar */}
        <div
          className="settings-sidebar"
          style={{
            minWidth: "220px",
            background: "#e8f5e9",
            borderRadius: "16px 0 0 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            padding: "32px 0",
            boxShadow: "2px 0 8px #0001",
          }}
        >
          <button
            onClick={() => setActiveTab("myprofile")}
            style={{
              background: activeTab === "myprofile" ? "#54b948" : "transparent",
              color: activeTab === "myprofile" ? "#fff" : "#388e3c",
              border: "none",
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: activeTab === "myprofile" ? "bold" : "500",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.2s, color 0.2s",
              borderRadius: "8px",
              margin: "0 16px 12px 16px",
            }}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab("about")}
            style={{
              background: activeTab === "about" ? "#54b948" : "transparent",
              color: activeTab === "about" ? "#fff" : "#388e3c",
              border: "none",
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: activeTab === "about" ? "bold" : "500",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.2s, color 0.2s",
              borderRadius: "8px",
              margin: "0 16px 12px 16px",
            }}
          >
            About Jalan
          </button>
          <button
            onClick={() => setActiveTab("help")}
            style={{
              background: activeTab === "help" ? "#54b948" : "transparent",
              color: activeTab === "help" ? "#fff" : "#388e3c",
              border: "none",
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: activeTab === "help" ? "bold" : "500",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.2s, color 0.2s",
              borderRadius: "8px",
              margin: "0 16px 12px 16px",
            }}
          >
            Help
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "#e57373",
              color: "#fff",
              border: "none",
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              textAlign: "left",
              borderRadius: "8px",
              margin: "0 16px 0 16px",
              marginTop: "auto",
              boxShadow: "0 2px 8px #e5737380",
            }}
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div
          className="settings-content"
          style={{
            flex: 1,
            padding: "40px 48px",
            overflowY: "auto",
            borderRadius: "0 16px 16px 0",
          }}
        >
          {activeTab === "myprofile" && (
            <div className="profile-section">
              <h2 style={{ fontWeight: "bold", color: "#54b948", marginBottom: "18px" }}>My Profile</h2>
              {user ? (
                <div style={{
                  background: "#f7f7f7",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 8px #0001",
                  maxWidth: "400px",
                  marginBottom: "24px"
                }}>
                  <div style={{ marginBottom: "12px" }}>
                    <strong style={{ color: "#388e3c" }}>Email:</strong>
                    <span style={{ marginLeft: "8px", color: "#333" }}>{user.email}</span>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <strong style={{ color: "#388e3c" }}>User ID:</strong>
                    <span style={{ marginLeft: "8px", color: "#333" }}>{user.id}</span>
                  </div>
                  {/* Add more user info fields here if available */}
                  <div style={{ marginBottom: "12px" }}>
                    <strong style={{ color: "#388e3c" }}>Created At:</strong>
                    <span style={{ marginLeft: "8px", color: "#333" }}>{user.created_at ? new Date(user.created_at).toLocaleString() : "N/A"}</span>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#888" }}>Loading user information...</p>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="about-section">
              <h2 style={{ fontWeight: "bold", color: "#54b948", marginBottom: "18px" }}>About Jalan</h2>
              <p style={{ fontSize: "18px", color: "#333", marginBottom: "18px" }}>
                <strong>JALAN</strong>: A Progressive Web Application Based Exam Checker with Real-Time Feedback Score and Data Analysis for College of St. Catherine Quezon City
              </p>
              <p style={{ fontSize: "16px", color: "#444", marginBottom: "12px" }}>
                JALAN is a modern, web-based examination system designed to streamline the assessment process through automation and real-time data analysis. By integrating with a Scantron machine, JALAN processes scanned exam sheets and delivers instant, accurate feedback—eliminating the inefficiencies and errors of traditional manual grading.
              </p>
              <p style={{ fontSize: "16px", color: "#444", marginBottom: "12px" }}>
                Drawing on findings by Ronnel C. et al. (2021), which demonstrated that Optical Mark Recognition (OMR) systems dramatically improve grading speed and accuracy compared to manual methods, JALAN harnesses these benefits to ensure reliable and efficient evaluation.
              </p>
              <p style={{ fontSize: "16px", color: "#444", marginBottom: "12px" }}>
                The system incorporates advanced technologies—such as Optical Character Recognition (OCR) and sentence embedding (Nithin, Y. et al., 2021)—to automatically assess both objective and descriptive answers, thereby enhancing the overall fairness and precision of academic assessments.
              </p>
              <p style={{ fontSize: "16px", color: "#444", marginBottom: "12px" }}>
                Designed specifically for the College of St. Catherine Quezon City, JALAN not only automates the grading process but also provides educators with valuable analytics. These insights support data-driven decision-making, helping teachers to identify learning trends and improve pedagogical strategies.
              </p>
              <p style={{ fontSize: "16px", color: "#444" }}>
                Ultimately, JALAN represents a significant innovation in examination management, reducing manual workload while ensuring that students receive prompt and accurate feedback to foster a more effective learning environment.
              </p>
            </div>
          )}

          {activeTab === "help" && (
            <div className="help-section">
              <h2 style={{ fontWeight: "bold", color: "#54b948", marginBottom: "18px" }}>Help</h2>
              <p style={{ fontSize: "16px", color: "#444" }}>
                This is a placeholder for the Help section. Content to be added later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setting;
