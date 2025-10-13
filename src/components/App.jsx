import { Route, Routes, Navigate } from 'react-router-dom';

import Login from './login';
import Signup from './signup'; // Role selection (student/teacher)
import Home from './home'; // Teacher dashboard
import StHome from './st-home'; // Student dashboard
import ScanExam from './scanExam';
import Register from './register'; // Teacher registration
import StRegister from './st-register'; // Student registration
import AnswerKey from './answerKey';
import AnswerSheet from './answerSheet';
import StGradeReport from './st-gradeReport';
import GradeReport from './gradeReport';
import StSetting from './st-setting'; // Student settings
import Setting from './setting'; // Teacher settings
import Admin from './admin'; // Admin dashboard
import AdminSetting from './adminsetting'; // Admin settings
import Offline from './Offline';

const App = () => {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Registration Flow */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/register" element={<Register />} /> {/* Teacher Registration */}
      <Route path="/st-register" element={<StRegister />} /> {/* Student Registration */}

      {/* Dashboards */}
      <Route path="/home" element={<Home />} /> {/* Teacher Dashboard */}
      <Route path="/st-home" element={<StHome />} /> {/* Student Dashboard */}
      <Route path="/admin-home" element={<Admin />} /> {/* Admin Dashboard */}

      {/* Other Pages */}
      <Route path="/scanExam" element={<ScanExam />} />
      <Route path="/answerKey" element={<AnswerKey />} />
      <Route path="/answerSheet" element={<AnswerSheet />} />
      <Route path="/gradeReport" element={<GradeReport />} />
      <Route path="/st-gradeReport" element={<StGradeReport />} />
      <Route path="/st-setting" element={<StSetting />} />
      <Route path="/setting" element={<Setting />} /> {/* Teacher Settings */}
      <Route path="/adminsetting" element={<AdminSetting />} /> {/* Admin Settings */}

      {/* Offline Fallback */}
      <Route path="/offline" element={<Offline />} />

      {/* Default Redirect to Login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
