import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// ==============================================================================
// 회원가입 페이지 컴포넌트
// ==============================================================================
function Register() {
  const [userId, setUserId] = useState('');
  const [userPw, setUserPw] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 서버의 회원가입 API 호출
      await axios.post('http://127.0.0.1:5000/api/register', {
        userID: userId,
        userPW: userPw
      });
      
      alert("회원가입 성공! 로그인해주세요.");
      navigate('/login'); // 가입 성공 시 로그인 페이지로 이동
    } catch (err) {
      // 서버에서 409 (중복 아이디) 등의 에러를 보낸 경우 처리
      if (err.response && err.response.data) {
          alert(`회원가입 실패: ${err.response.data.message}`);
      } else {
          alert("회원가입 실패");
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formBox}>
        <h1 style={styles.logo}>InstaClone</h1>
        <h2 style={styles.subtitle}>Sign up to see photos and videos from your friends.</h2>
        
        <form onSubmit={handleSubmit} style={styles.form}>
           <input 
             type="text" 
             placeholder="Mobile Number or Email" 
             value={userId}
             onChange={(e) => setUserId(e.target.value)}
             style={styles.input}
           />
           <input 
             type="password" 
             placeholder="Password" 
             value={userPw}
             onChange={(e) => setUserPw(e.target.value)}
             style={styles.input}
           />
           <button type="submit" style={styles.button}>Sign up</button>
        </form>
        
        <div style={styles.loginBox}>
            <span style={styles.text}>Have an account? </span>
            <Link to="/login" style={styles.link}>Log in</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#FAFAFA',
  },
  formBox: {
    backgroundColor: '#fff',
    border: '1px solid #DBDBDB',
    padding: '40px',
    width: '350px',
    textAlign: 'center',
  },
  logo: {
    fontFamily: "'Grand Hotel', cursive",
    fontSize: '3rem',
    marginBottom: '10px',
  },
  subtitle: {
    color: '#8E8E8E',
    fontSize: '17px',
    fontWeight: 'bold',
    marginBottom: '20px',
    lineHeight: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '9px 8px',
    border: '1px solid #DBDBDB',
    borderRadius: '3px',
    backgroundColor: '#FAFAFA',
    fontSize: '12px',
  },
  button: {
    backgroundColor: '#0095F6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '7px 0',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
  },
  loginBox: {
    marginTop: '20px',
    fontSize: '14px',
  },
  text: {
    color: '#262626',
  },
  link: {
    color: '#0095F6',
    fontWeight: 'bold',
    textDecoration: 'none',
  }
};

export default Register;
