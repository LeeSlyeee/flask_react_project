import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 페이지 이동을 위한 훅
import axios from 'axios';

// ==============================================================================
// 로그인 페이지 컴포넌트
// ==============================================================================
// 사용자가 아이디와 비밀번호를 입력하고, 서버에 전송하여 인증을 요청합니다.
function Login({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [userPw, setUserPw] = useState('');
  const navigate = useNavigate(); // 자바스크립트 코드로 페이지를 이동시킬 때 사용

  // 로그인 폼 제출 시 실행되는 함수
  const handleSubmit = async (e) => {
    e.preventDefault(); // 중요: 폼 제출 시 브라우저가 자동으로 새로고침하는 것을 막습니다.
    
    try {
      // 서버의 로그인 API 호출
      const res = await axios.post('http://127.0.0.1:5000/api/login', {
        userID: userId,
        userPW: userPw
      });
      
      // 요청 성공 시 (200 OK)
      if (res.status === 200) {
        alert("로그인 성공!");
        // 부모 컴포넌트(App.jsx)의 onLogin 함수를 호출하여 앱 전체의 로그인 상태를 갱신합니다.
        onLogin(res.data.user);
      }
    } catch (err) {
      // 요청 실패 시 (401 Unauthorized 등)
      alert("로그인 실패: 아이디 또는 비밀번호를 확인하세요.");
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formBox}>
        <h1 style={styles.logo}>InstaClone</h1>
        
        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} style={styles.form}>
           {/* 아이디 입력 */}
           <input 
             type="text" 
             placeholder="Phone number, username, or email" 
             value={userId}
             onChange={(e) => setUserId(e.target.value)} // 입력할 때마다 State 업데이트
             style={styles.input}
           />
           {/* 비밀번호 입력 */}
           <input 
             type="password" 
             placeholder="Password" 
             value={userPw}
             onChange={(e) => setUserPw(e.target.value)}
             style={styles.input}
           />
           {/* 로그인 버튼 */}
           <button type="submit" style={styles.button}>Log In</button>
        </form>

        <div style={styles.divider}>
            <div style={styles.line}></div>
            <div style={styles.or}>OR</div>
            <div style={styles.line}></div>
        </div>
        
        {/* 회원가입 페이지로 이동하는 링크 */}
        <div style={styles.signupBox}>
            <span style={styles.text}>Don't have an account? </span>
            <Link to="/register" style={styles.link}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}

// 스타일 객체 (CSS를 자바스크립트 객체로 정의)
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
    fontFamily: "'Grand Hotel', cursive", // 인스타그램 스타일 폰트
    fontSize: '3rem',
    marginBottom: '30px',
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
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
  },
  line: {
    flex: 1,
    height: '1px',
    backgroundColor: '#DBDBDB',
  },
  or: {
    margin: '0 10px',
    fontSize: '13px',
    color: '#8E8E8E',
    fontWeight: 'bold',
  },
  signupBox: {
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

export default Login;
