import { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';

// ==============================================================================
// 피드 페이지 (Feed Page)
// ==============================================================================
// 인스타그램의 메인 화면입니다. 모든 사용자의 게시물을 리스트로 보여줍니다.
function Feed({ userInfo }) {
  const [posts, setPosts] = useState([]); // 게시물 목록을 저장할 State (초기값: 빈 배열)
  const [isModalOpen, setIsModalOpen] = useState(false); // 글쓰기 모달창을 열지 말지 결정하는 State

  // ============================================================================
  // 데이터 로딩 (useEffect)
  // ============================================================================
  // 컴포넌트가 처음 화면에 뜰 때, 서버에서 게시물 목록을 가져옵니다.
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // 로그인한 사용자의 userKey를 같이 보내서, 내가 '좋아요' 한 글인지 여부를 체크받습니다.
      const res = await axios.get(`http://127.0.0.1:5000/api/posts?userKey=${userInfo.userKey}`);
      setPosts(res.data); // 받아온 데이터를 State에 저장 -> 화면이 자동으로 갱신됨
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
  };

  return (
    <div style={styles.container}>
      {/* 글쓰기 버튼 */}
      <button onClick={() => setIsModalOpen(true)} style={styles.createBtn}>
        + Create New Post
      </button>

      {/* 게시물 목록 렌더링 */}
      <div style={styles.feed}>
        {/* posts 배열을 map 함수로 돌면서, 각 게시물 데이터 하나당 PostCard 컴포넌트 하나를 그립니다. */}
        {posts.map(post => (
          <PostCard 
            key={post.postKey} // 리액트에서 반복문을 쓸 땐 고유한 key가 반드시 필요합니다 (성능 최적화).
            post={post}        // 게시물 데이터 전달
            userInfo={userInfo} // 내 정보 전달 (좋아요, 댓글 작성 시 필요)
          />
        ))}
      </div>

      {/* 글쓰기 모달창 (isModalOpen이 true일 때만 보임) */}
      {isModalOpen && (
        <CreatePostModal 
            onClose={() => setIsModalOpen(false)} // 닫기 버튼 누르면 실행될 함수
            userInfo={userInfo}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // 가운데 정렬
    paddingTop: '20px',
    backgroundColor: '#FAFAFA',
    minHeight: '100vh',
  },
  createBtn: {
    marginBottom: '20px',
    padding: '10px 20px',
    backgroundColor: '#0095F6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px', // 게시물 사이 간격
  }
};

export default Feed;
