import "/src/components/style.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from '../supabaseClient';

const StudentRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    course: '',
    section: '',
    yearLevel: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, email, course, section, yearLevel, password, confirmPassword } = formData;

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
      .insert([{ username: fullName, email, course, section, year_level: yearLevel }]);

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
              <label htmlFor="course">Course</label>
              <select
                name="course"
                id="course"
                required
                onChange={handleChange}
                defaultValue=""
              >
                <option value="" disabled>Select a course</option>
                <option value="Bachelor of Science in Computer Science">Bachelor of Science in Computer Science</option>
                <option value="Bachelor of Science in Information Technology">Bachelor of Science in Information Technology</option>
                <option value="Bachelor of Science in Computer Engineering">Bachelor of Science in Computer Engineering</option>
                <option value="Bachelor of Science in Business Administration">Bachelor of Science in Business Administration</option>
                <option value="Bachelor of Science in Accountancy">Bachelor of Science in Accountancy</option>
                <option value="Bachelor of Science in Hospitality Management">Bachelor of Science in Hospitality Management</option>
                <option value="Bachelor of Arts in Communication">Bachelor of Arts in Communication</option>
                <option value="Bachelor of Multimedia Arts">Bachelor of Multimedia Arts</option>
                <option value="Bachelor of Science in Tourism Managements">Bachelor of Science in Tourism Managements</option>
              </select>
            </div>
            <div className="field input">
              <label htmlFor="section">Section</label>
              <select
                name="section"
                id="section"
                required
                onChange={handleChange}
                defaultValue=""
              >
                <option value="" disabled>Select a section</option>
                <option value="Section 1">Section 1</option>
                <option value="Section 2">Section 2</option>
                <option value="Section 3">Section 3</option>
                <option value="Section 4">Section 4</option>
                <option value="Section 5">Section 5</option>
                <option value="Section 5">Section 6</option>
                <option value="Section 5">Section 7</option>
                <option value="Section 5">Section 8</option>
                <option value="Section 5">Section 9</option>
                <option value="Section 5">Section 10</option>
                <option value="Section 5">Section 11</option>
                <option value="Section 5">Section 12</option>
                <option value="Section 5">Section 13</option>
                <option value="Section 5">Section 14</option>
                <option value="Section 5">Section 15</option>
              </select>
            </div>
            <div className="field input">
              <label htmlFor="yearLevel">Year Level</label>
              <select
                name="yearLevel"
                id="yearLevel"
                required
                onChange={handleChange}
                defaultValue=""
              >
                <option value="" disabled>Select year level</option>
                <option value="1st year">1st year</option>
                <option value="2nd year">2nd year</option>
                <option value="3rd year">3rd year</option>
                <option value="4th year">4th year</option>
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
