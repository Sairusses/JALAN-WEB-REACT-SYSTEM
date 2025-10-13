import "/src/components/style.css";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  return (
    <div className="dashboard-container">
      {/* ----------------------------------------------- LOGO --------------------------------------------------------------- */}
      <div className="logo-container">
        <img src="/src/img/stcathlogo.png" alt="Logo" className="logo" />
      </div>

      <header>
        <h1>WELCOME STUDENT</h1>
        <p>VIEW YOUR REAL TIME GRADES!</p>
      </header>

      {/* ----------------------------------------------- SETTINGS ----------------------------------------------- */}
      <Link to="/st-setting">
        <div title="settings" className="settings">
          <img src="/src/img/Settingss.png" alt="Settings" className="settings-icon" />
        </div>
      </Link>

      <div className="dashboard">
        {/* ----------------------------------------------- GRADE REPORT ----------------------------------------------- */}
        <div className="dashboard-item">
          <Link to="/st-gradeReport">
            <div className="icon">
              <img src="/src/img/ReportGrade.png" alt="Grade Report" />
            </div>
            <p>Grade Report</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
