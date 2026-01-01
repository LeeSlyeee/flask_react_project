import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom'; // URL 파라미터 가져오는 훅
import axios from 'axios';
import PostCard from '../components/PostCard';
import { formatUsername } from '../utils';

// ==============================================================================
// 프로필 페이지 (Profile Page)
// ==============================================================================
// 특정 사용자의 게시물만 모아서 보여주는 페이지입니다.
// URL 예시: /profile/test_user (여기서 test_user가 userID 파라미터가 됨)
function Profile({ userInfo: currentUser }) {
  const { userID } = useParams(); // URL에서 ':userID' 부분의 값을 가져옵니다.
  const [posts, setPosts] = useState([]);
  const [profileUser, setProfileUser] = useState(null); // 프로필 주인의 정보

  useEffect(() => {
    fetchProfileData();
  }, [userID]); // userID가 바뀔 때마다(다른 사람 프로필로 갈 때마다) 새로 실행

  const fetchProfileData = async () => {
    try {
      // 1. 프로필 주인의 게시물 가져오기 (쿼리 파라미터 targetUserID 사용)
      const res = await axios.get(`http://127.0.0.1:5000/api/posts?targetUserID=${userID}&userKey=${currentUser.userKey}`);
      setPosts(res.data);
      
      // 2. 게시물 중 하나에서 작성자 정보를 가져와서 프로필 정보로 사용
      if (res.data.length > 0) {
          setProfileUser({
              userID: res.data[0].userID, // 글 작성자의 원본 ID (이메일 등 포함)
              profileImage: res.data[0].profileImage
          });
      } else {
          // 게시물이 없는 경우
          // 만약 "내 프로필"이라면, currentUser 정보를 그대로 사용합니다.
          if (formatUsername(currentUser.userID) === userID) {
              setProfileUser({
                  userID: currentUser.userID,
                  profileImage: currentUser.profileImage
              });
          } else {
               // 남의 프로필인데 글이 없으면 정보를 알 방법이 없으므로(별도 API 부재) 기본값 설정
               setProfileUser({ userID: userID, profileImage: null });
          }
      }

    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  // 프로필 사진 변경 함수 (파일 업로드)
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 전송을 위해서는 반드시 FormData 객체를 사용해야 합니다.
    const formData = new FormData();
    formData.append('image', file);
    formData.append('userKey', currentUser.userKey);

    try {
        await axios.post('http://127.0.0.1:5000/api/profile/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' } // 파일 전송 시 필수 헤더
        });
        alert("프로필 사진이 변경되었습니다.");
        window.location.reload(); // 새로고침하여 변경된 사진 반영
    } catch (err) {
        console.error("Upload failed", err);
        alert("업로드 실패");
    }
  };

  // ============================================================================
  // 뷰 모드 및 스크롤 관리 (View Mode & Scroll Management)
  // ============================================================================
  // viewMode: 'grid'(사진만 격자로 보기) 또는 'list'(일반 피드 형태로 보기) 상태를 관리합니다.
  const [viewMode, setViewMode] = useState('grid');
  
  // postRefs: 리스트 뷰에서 각 게시물의 위치(DOM 엘리먼트)를 저장하기 위한 객체입니다.
  // 특정 게시물로 자동 스크롤할 때 사용합니다. { [postKey]: HTMLDivElement, ... }
  const postRefs = useRef({});

  // 그리드에서 사진을 클릭했을 때 실행되는 함수
  const handleGridClick = (postKey) => {
    // 1. 뷰 모드를 'list'로 변경하여 피드 화면을 보여줍니다.
    setViewMode('list');
    
    // 2. 화면이 리스트로 다시 그려진 후에 스크롤을 이동해야 하므로 setTimeout을 사용합니다.
    // 리액트의 상태 변경 -> 렌더링 -> DOM 업데이트 과정이 비동기로 일어나기 때문에 약간의 지연이 필요합니다.
    setTimeout(() => {
        const element = postRefs.current[postKey];
        if (element) {
            // scrollIntoView: 해당 요소가 화면에 보이도록 자동으로 스크롤해주는 브라우저 API
            // behavior: 'smooth'는 부드럽게 이동, block: 'start'는 요소의 윗부분을 화면 상단에 맞춤
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
  };

  return (
    <div style={styles.container}>
        {/* --- 프로필 헤더 섹션 (Profile Header) --- */}
        <div style={styles.profileHeader}>
            <div style={styles.avatarContainer}>
                {/* 프로필 이미지 */}
                <label htmlFor="profile-upload" style={{cursor: 'pointer'}}>
                    {profileUser?.profileImage ? (
                        <img src={`http://127.0.0.1:5000${profileUser.profileImage}`} style={styles.avatar} alt="profile" />
                    ) : (
                        <div style={styles.avatarPlaceholder} />
                    )}
                </label>
                {/* 내 프로필이고(아이디 일치 확인), 클릭 시 파일 입력창이 동작하도록 설정 */}
                {/* formatUsername을 사용해 짧은 아이디('user')와 실제 아이디('user@...')를 비교합니다. */}
                {formatUsername(currentUser.userID) === userID && (
                    <input 
                        id="profile-upload" 
                        type="file" 
                        style={{display: 'none'}} 
                        accept="image/*" 
                        onChange={handleProfileImageUpload}
                    />
                )}
            </div>
            
            <div style={styles.info}>
                <h2 style={styles.username}>{userID}</h2>
                <div style={styles.stats}>
                    <span><strong>{posts.length}</strong> posts</span>
                    <span><strong>0</strong> followers</span>
                    <span><strong>0</strong> following</span>
                </div>
                <div style={styles.bio}>
                    <strong>{userID}</strong>
                    <p>Welcome to my profile!</p>
                </div>
            </div>
        </div>

        {/* --- 뷰 모드 탭 (Tab Navigation: Grid vs Feed) --- */}
        <div style={styles.tabContainer}>
            {/* 그리드 보기 버튼: 활성화 상태일 때 위쪽에 검은 줄과 진한 글씨 표시 */}
            <button 
                style={{...styles.tabBtn, borderTop: viewMode === 'grid' ? '1px solid black' : 'none', color: viewMode === 'grid' ? 'black' : '#8e8e8e'}} 
                onClick={() => setViewMode('grid')}
            >
                Grid
            </button>
            {/* 피드 보기 버튼 */}
            <button 
                style={{...styles.tabBtn, borderTop: viewMode === 'list' ? '1px solid black' : 'none', color: viewMode === 'list' ? 'black' : '#8e8e8e'}} 
                onClick={() => setViewMode('list')}
            >
                Feed
            </button>
        </div>

        {/* --- 게시물 콘텐츠 영역 (Content Area) --- */}
        
        {viewMode === 'grid' ? (
            // [Grid View] 3열 그리드로 썸네일만 표시
            <div style={styles.gridContainer}>
                {posts.map(post => (
                    <div 
                        key={post.postKey} 
                        style={styles.gridItem}
                        // 클릭 시 해당 게시물이 있는 리스트 뷰로 이동
                        onClick={() => handleGridClick(post.postKey)}
                    >
                        <img 
                            src={`http://127.0.0.1:5000${post.photoSrc}`} 
                            alt="Post thumbnail" 
                            style={styles.gridImage}
                        />
                    </div>
                ))}
            </div>
        ) : (
            // [List/Feed View] 일반 피드처럼 상세 내용(PostCard) 표시
            <div style={styles.feed}>
                {posts.map(post => (
                    // ref 연결: 나중에 이 div 위치로 스크롤하기 위해 레퍼런스를 저장해둡니다.
                    <div key={post.postKey} ref={el => postRefs.current[post.postKey] = el}>
                        <PostCard 
                            post={post}
                            userInfo={currentUser}
                        />
                    </div>
                ))}
            </div>
        )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '935px',
    margin: '0 auto',
    padding: '30px 20px',
  },
  profileHeader: {
    display: 'flex',
    marginBottom: '0px', // 탭과의 간격을 위해 줄임
    alignItems: 'center',
    paddingBottom: '44px',
    borderBottom: '1px solid #dbdbdb'
  },
  avatarContainer: {
      flex: '0 0 290px', 
      display: 'flex',
      justifyContent: 'center',
      marginRight: '30px'
  },
  avatar: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '1px solid #dbdbdb'
  },
  avatarPlaceholder: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      backgroundColor: '#efefef',
      border: '1px solid #dbdbdb'
  },
  info: {
      flex: 1
  },
  username: {
      fontSize: '28px',
      fontWeight: '300',
      marginBottom: '20px'
  },
  stats: {
      display: 'flex',
      gap: '40px',
      fontSize: '16px',
      marginBottom: '20px'
  },
  bio: {
      fontSize: '16px'
  },
  // --- 탭 스타일 ---
  tabContainer: {
      display: 'flex',
      justifyContent: 'center',
      borderTop: '1px solid #dbdbdb', // 헤더와 구분선?
      marginBottom: '20px',
      gap: '60px'
  },
  tabBtn: {
      padding: '15px 0',
      background: 'none',
      border: 'none',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      cursor: 'pointer',
      letterSpacing: '1px'
  },
  // --- 그리드 스타일 ---
  gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: '28px',
  },
  gridItem: {
      aspectRatio: '1 / 1', 
      cursor: 'pointer',
      position: 'relative',
      backgroundColor: '#efefef'
  },
  gridImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
  },
  // --- 피드(리스트) 스타일 ---
  feed: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      alignItems: 'center',
      marginTop: '20px'
  }
};

export default Profile;
