import "/src/components/style.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from '../supabaseClient';

const StudentRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentIdNumber: '',
    fullName: '',
    email: '',
    course: '',
    phoneNumber: '', // Added phone number
    password: '',
    confirmPassword: '',
    yearLevel: '1st Year', // Set default value here
  });
  const [showPassword, setShowPassword] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    // Fetch courses from Supabase
    const fetchCourses = async () => {
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from('courses')
        .select('course');
      if (error) {
        setCourses([]);
      } else {
        setCourses(data.map((c) => c.course));
      }
      setLoadingCourses(false);
    };
    fetchCourses();
  }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { studentIdNumber, fullName, email, course, phoneNumber, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Create user with Supabase Auth
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert(authError.message);
      return;
    }

    // Insert additional student details into the 'students' table,
    // inserting the full name into the username column.
    const { error: dbError } = await supabase
      .from('students')
      .insert([{
        student_id_number: studentIdNumber,
        username: fullName,
        email,
        course,
        section: 'N/A', // Add this line
        phone_number: phoneNumber,
      }]);

    if (dbError) {
      alert(dbError.message);
      return;
    }

    // Redirect student to the student dashboard
    navigate('/st-home');
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              background-image: url('/src/img/st cath bf.jpg');
              background-size: cover;
              background-repeat: no-repeat;
              background-position: center;
              height: 100vh;
              margin: 0;
            }
          `,
        }}
      />
      <div className="container">
        <div className="box form-box">
          <header>Student Registration</header>
          <form onSubmit={handleSubmit}>
            <div className="field input">
              <label htmlFor="studentIdNumber">Student ID Number</label>
              <input
                type="text"
                name="studentIdNumber"
                id="studentIdNumber"
                placeholder="Enter your student ID number"
                autoComplete="off"
                required
                onChange={handleChange}
              />
            </div>
            <div className="field input">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                placeholder="Enter your full name (required)"
                autoComplete="off"
                required
                onChange={handleChange}
              />
              <small style={{ color: 'red' }}>
                * Please input your full name; otherwise, the admin won't recognize you.
              </small>
            </div>
            <div className="field input">
              <label htmlFor="email">Email</label>
              <input
                type="text"
                name="email"
                id="email"
                autoComplete="off"
                required
                onChange={handleChange}
              />
            </div>
            <div className="field input">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                id="phoneNumber"
                placeholder="Enter your phone number"
                autoComplete="off"
                required
                onChange={handleChange}
                value={formData.phoneNumber}
              />
            </div>
            <div className="field input">
              <label htmlFor="course">Course</label>
              <select
                name="course"
                id="course"
                required
                onChange={handleChange}
                value={formData.course}
                disabled={loadingCourses}
              >
                <option value="" disabled>
                  {loadingCourses ? "Loading courses..." : "Select a course"}
                </option>
                {courses.map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            <div className="field input">
              <label htmlFor="password">Password</label>
              <div className="password-field" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  autoComplete="off"
                  required
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ marginLeft: '8px' }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="field input">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-field" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  autoComplete="off"
                  required
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ marginLeft: '8px' }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="field">
              <input type="submit" className="btn" name="submit" value="Register" />
            </div>
            <div className="link">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default StudentRegistration;
