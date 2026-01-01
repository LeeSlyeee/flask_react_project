import { Link, useNavigate } from 'react-router-dom';
import { formatUsername } from '../utils';

// ==============================================================================
// 헤더 컴포넌트 (Header)
// ==============================================================================
// 앱의 상단 네비게이션 바입니다.
// 홈으로 가기, 글쓰기, 프로필 이동, 로그아웃 기능을 제공합니다.
function Header({ onLogout, userInfo }) {
  // useNavigate: 페이지 이동을 코드로 제어하기 위한 훅
  const navigate = useNavigate();

  // 실제 로그아웃 로직 (App.jsx에서 전달받은 함수 실행)
  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* 로고: 클릭 시 홈('/')으로 이동 */}
        <Link to="/" style={styles.logoLink}>
            <h1 style={styles.logo}>InstaClone</h1>
        </Link>
        
        {/* 네비게이션 아이콘들 */}
        <div style={styles.nav}>
            {/* 홈 버튼 */}
            <Link to="/">
                <svg aria-label="Home" color="#262626" fill="#262626" height="24" role="img" viewBox="0 0 24 24" width="24">
                    <path d="M22 23h-6.001a1 1 0 01-1-1v-5.455a2.997 2.997 0 10-5.993 0V22a1 1 0 01-1 1H2a1 1 0 01-1-1V11.543a1.002 1.002 0 01.31-.724l10-9.543a1.001 1.001 0 011.38 0l10 9.543a1.002 1.002 0 01.31.724V22a1 1 0 01-1 1z"></path>
                </svg>
            </Link>
            
            {/* 프로필 이미지 아이콘: 클릭 시 내 프로필 페이지로 이동 */}
            <Link to={`/profile/${formatUsername(userInfo.userID)}`} style={styles.profileLink}>
                {userInfo.profileImage ? (
                    <img src={`http://127.0.0.1:5000${userInfo.profileImage}`} alt="Profile" style={styles.profileImg} />
                ) : (
                    <div style={styles.profilePlaceholder} />
                )}
            </Link>

            {/* 로그아웃 버튼 */}
            <button onClick={handleLogoutClick} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #DBDBDB',
    position: 'sticky', // 스크롤 내려도 상단에 고정
    top: 0,
    zIndex: 100, // 다른 요소들보다 위에 떠있게 함
    height: '60px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '975px', // 인스타그램 웹 버전의 기준 너비
    maxWidth: '100%',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoLink: {
      textDecoration: 'none',
      color: 'black'
  },
  logo: {
    fontFamily: "'Grand Hotel', cursive",
    fontSize: '1.8rem',
    margin: 0,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
  },
  logoutBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      color: '#0095F6'
  },
  profileLink: {
      display: 'block',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      overflow: 'hidden',
      border: '1px solid #dbdbdb'
  },
  profileImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
  },
  profilePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: '#efefef'
  }
};

export default Header;
