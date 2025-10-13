import "/src/components/style.css";
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '', // Can be either email or username
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let email = formData.identifier.trim();

      // If the identifier doesn't include an '@', assume it's a username
      if (!email.includes('@')) {
        // Try to find the user in the teachers table
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('email')
          .eq('username', email)
          .maybeSingle();

        if (teacherData && teacherData.email) {
          email = teacherData.email;
        } else {
          // Try the students table
          const { data: studentData } = await supabase
            .from('students')
            .select('email')
            .eq('username', email)
            .maybeSingle();

          if (studentData && studentData.email) {
            email = studentData.email;
          } else {
            // Finally, try the admins table
            const { data: adminData } = await supabase
              .from('admins')
              .select('email')
              .eq('email', email)
              .maybeSingle();

            if (adminData && adminData.email) {
              email = adminData.email;
            } else {
              setError("User not found. Please check your credentials or register.");
              setLoading(false);
              return;
            }
          }
        }
      }

      // Clear any existing session before signing in
      await supabase.auth.signOut();

      // Attempt to sign in with the resolved email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Bypass role lookup: if the email matches admin@gmail.com, navigate to admin-home
      if (email.toLowerCase() === 'admin@gmail.com') {
        navigate('/admin-home');
        return;
      }

      // Check teacher role
      const { data: teacherRole } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (teacherRole) {
        navigate('/home');
        return;
      }

      // Check student role
      const { data: studentRole } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (studentRole) {
        navigate('/st-home');
        return;
      }

      setError("User role not found. Please contact support.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            }
          `,
        }}
      />
      <div className="container">
        <div className="box form-box">
          <header>Login</header>
          <form onSubmit={handleSubmit}>
            <div className="field input">
              <label htmlFor="identifier">Email or Username</label>
              <input
                type="text"
                name="identifier"
                id="identifier"
                autoComplete="off"
                required
                value={formData.identifier}
                onChange={(e) =>
                  setFormData({ ...formData, identifier: e.target.value })
                }
              />
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
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
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
              <input
                type="submit"
                className="btn"
                name="submit"
                value={loading ? 'Logging in...' : 'Log in'}
                disabled={loading}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="link">
              Don&apos;t have an account? <Link to="/signup">Sign up</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
