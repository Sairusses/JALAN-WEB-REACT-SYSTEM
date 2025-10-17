import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";

const TopNavbar = ({ activePage }) => {
  const navigate = useNavigate();

  const navigateWithState = (path) => {
    navigate(path);
  };

  const navItems = [
    { path: "/scanExam", label: "Scan Exam", icon: "/src/img/ExamScan.png" },
    { path: "/answerKey", label: "Answer Key", icon: "/src/img/AnswerKeys.png" },
    { path: "/answerSheet", label: "Answer Sheet", icon: "/src/img/Sheet.png" },
    { path: "/gradeReport", label: "Grade Report", icon: "/src/img/ReportGrade.png" },
  ];

  return (
    <nav
      className="top-navbar"
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
      {/* Left Side */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link
          to="/home"
          onClick={(e) => {
            e.preventDefault();
            navigateWithState("/home");
            window.location.reload();
          }}
        >
          <img
            src="/src/img/house.png"
            alt="Back"
            style={{ width: "32px", marginRight: "12px", cursor: "pointer" }}
          />
        </Link>
        <span
          style={{
            color: "#fff",
            fontWeight: "bold",
            fontSize: "22px",
            letterSpacing: "1px",
          }}
        >
          {activePage ?? "Home"}
        </span>
      </div>

      {/* Right Side */}
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={(e) => {
              e.preventDefault();
              navigateWithState(item.path);
              window.location.reload();
            }}
            style={{
              color: "#fff",
              textDecoration:
                activePage === item.label ? "underline" : "none",
              fontWeight: activePage === item.label ? 700 : 500,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={item.icon}
              alt={item.label}
              style={{
                width: "28px",
                verticalAlign: "middle",
                marginRight: "6px",
              }}
            />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

TopNavbar.propTypes = {
  activePage: PropTypes.string.isRequired,
};

export default TopNavbar;