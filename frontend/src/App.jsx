import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Header from './components/Header'
import axios from 'axios'
import './App.css'

// ==============================================================================
// 메인 앱 컴포넌트
// ==============================================================================
// 이 파일은 앱의 '뼈대' 역할을 합니다.
// 1. 페이지 이동 규칙(라우팅)을 정의하고
// 2. 로그인 상태(누가 로그인했는지)를 전역적으로 관리합니다.

function App() {
  // ============================================================================
  // 상태 관리 (State Management)
  // ============================================================================
  
  // isAuthenticated: 로그인이 되었는가? (true/false)
  // 초기값: 브라우저 저장소(localStorage)에 'user' 정보가 있으면 true, 없으면 false로 시작 (새로고침 시 유지용)
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('user'));
  
  // userInfo: 로그인한 사용자의 구체적인 정보 (아이디, userKey 등)
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('user')));

  // ============================================================================
  // 앱 시작 시 실행 로직 (useEffect)
  // ============================================================================
  // useEffect: 컴포넌트가 화면에 나타날 때(마운트) 실행되는 함수입니다.
  useEffect(() => {
    const verifySession = async () => {
      // 로컬 스토리지에 사용자 정보가 있다면, 실제 서버에서도 유효한지 확인합니다.
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
         try {
           // 백엔드에 '이 사람 진짜 맞아요?' 하고 물어봅니다.
           const res = await axios.get(`http://127.0.0.1:5000/api/auth/verify?userKey=${user.userKey}`);
           
           // 성공하면(유효한 유저면) 서버에서 받은 최신 정보로 갱신합니다.
           // (예: 프로필 사진이 바뀌었을 수도 있으니까요)
           if (res.data.user) {
               setUserInfo(res.data.user);
               localStorage.setItem('user', JSON.stringify(res.data.user));
           }
         } catch (err) {
            // 실패하면(가짜 정보이거나 서버에서 삭제된 유저면) 강제로 로그아웃 처리
            console.error("Session invalid", err);
            handleLogout();
         }
      }
    };
    verifySession();
  }, []); // [] 빈 배열: 이 코드는 앱이 켜질 때 딱 한 번만 실행됨

  // ============================================================================
  // 이벤트 핸들러
  // ============================================================================

  // 로그인 성공 시 실행할 함수
  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUserInfo(user);
    // 브라우저 로컬 스토리지에 저장 (새로고침 해도 안 날아가게)
    localStorage.setItem('user', JSON.stringify(user));
  };

  // 로그아웃 시 실행할 함수
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    localStorage.removeItem('user'); // 저장소에서 삭제
    window.location.href = '/login'; // 로그인 페이지로 강제 이동
  };

  // ============================================================================
  // 화면 렌더링 (Routing)
  // ============================================================================
  return (
    <Router>
      <div className="app-container">
        {/* 헤더는 로그인한 상태일 때만 보여줍니다. */}
        {isAuthenticated && <Header onLogout={handleLogout} userInfo={userInfo} />}
        
        {/* Routes: 현재 주소창의 URL에 따라 어떤 컴포넌트를 보여줄지 결정합니다. */}
        <Routes>
          {/* 로그인, 회원가입 페이지는 로그아웃 상태일 때만 접근 가능 */}
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          
          {/* 메인 피드와 프로필은 로그인해야만 접근 가능 (Protected Route) */}
          <Route 
             path="/" 
             element={isAuthenticated ? <Feed userInfo={userInfo} /> : <Navigate to="/login" />} 
          />
          <Route 
             path="/profile/:userID" 
             element={isAuthenticated ? <Profile userInfo={userInfo} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
