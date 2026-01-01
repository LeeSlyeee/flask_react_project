import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatUsername } from '../utils';

// ==============================================================================
// 게시물 카드 컴포넌트 (PostCard)
// ==============================================================================
// 피드에서 보여지는 '게시물 하나'를 담당하는 컴포넌트입니다.
// 좋아요, 댓글 작성, 대댓글, 삭제 등 다양한 상호작용이 여기서 일어납니다.
function PostCard({ post, userInfo }) {
  // 백엔드 주소 (이미지 경로 등을 위해 필요)
  const backendUrl = 'http://127.0.0.1:5000';
  // 게시물 이미지 전체 URL 완성
  const imageUrl = `${backendUrl}${post.photoSrc}`;

  // ============================================================================
  // 상태 관리 (Local State)
  // ============================================================================
  // isLiked: 내가 이 글에 좋아요를 눌렀는가? (서버에서 받아온 초기값 사용)
  const [isLiked, setIsLiked] = useState(post.is_liked);
  // likeCount: 현재 좋아요 개수 (숫자가 실시간으로 변해야 하므로 State로 관리)
  const [likeCount, setLikeCount] = useState(post.like_count);
  
  // comments: 댓글 목록 (댓글 추가/삭제 시 화면을 갱신하기 위해 State로 관리)
  const [comments, setComments] = useState(post.comments || []);
  // commentInput: 댓글 입력창의 텍스트
  const [commentInput, setCommentInput] = useState('');

  // replyTarget: 현재 '대댓글'을 달고 있는 대상 정보 (null이면 일반 댓글 모드)
  const [replyTarget, setReplyTarget] = useState(null);

  // ============================================================================
  // 이벤트 핸들러 (사용자 행동 처리)
  // ============================================================================

  // 1. 좋아요 버튼 클릭
  const handleLike = async () => {
    try {
      // 서버에 좋아요 요청 전송 (Toggle 방식: 누르면 켜지고, 다시 누르면 꺼짐)
      const res = await axios.post(`${backendUrl}/api/posts/${post.postKey}/likes`, {
        userKey: userInfo.userKey
      });
      
      // 서버 응답(res.data.liked)에 맞춰서 하트 모양 채우기/비우기
      setIsLiked(res.data.liked);
      
      // 좋아요 수 숫자로 갱신 (좋아요면 +1, 취소면 -1)
      setLikeCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  // 2. 답글(대댓글) 모드 켜기
  const handleReply = (comment) => {
    // 아이디에서 이메일 뒷부분(@domain.com) 제거하여 깔끔하게 표시
    const formattedName = formatUsername(comment.userID);
    
    setReplyTarget({
        commentKey: comment.commentKey,
        username: formattedName
    });
    // 입력창에 "@아이디 "를 미리 적어둬서 대댓글임을 티냅니다.
    setCommentInput(`@${formattedName} `);
  };
  
  // 3. 답글 모드 취소 (Cancel 버튼)
  const cancelReply = () => {
    setReplyTarget(null);
    setCommentInput('');
  };

  // 4. 댓글 전송 (Submit)
  const handleCommentSubmit = async (e) => {
    e.preventDefault(); // 폼 제출 시 새로고침 방지
    if (!commentInput.trim()) return; // 빈 칸이면 전송 안 함

    try {
      const payload = {
        userKey: userInfo.userKey,
        userID: userInfo.userID,
        content: commentInput,
        // 대댓글이면 부모 댓글 ID를 함께 보냅니다. (일반 댓글이면 null)
        parentKey: replyTarget ? replyTarget.commentKey : null 
      };

      const res = await axios.post(`${backendUrl}/api/posts/${post.postKey}/comments`, payload);
      
      // 전송 성공!
      // 1. 기존 댓글 목록(...comments) 뒤에 새 댓글(res.data.comment)을 붙여서 State 업데이트
      setComments([...comments, res.data.comment]);
      // 2. 입력창 비우기
      setCommentInput('');
      // 3. 답글 모드였으면 해제하기
      setReplyTarget(null);
    } catch (err) {
       console.error("Comment failed", err);
    }
  };

  // 5. 게시물 삭제 (본인 글인 경우만)
  const handleDeletePost = async () => {
    if (!window.confirm("게시물을 삭제하시겠습니까? (복구 불가)")) return;
    try {
      await axios.delete(`${backendUrl}/api/posts/${post.postKey}?userKey=${userInfo.userKey}`);
      window.location.reload(); // 삭제 후 목록 갱신을 위해 페이지 새로고침 (가장 쉬운 방법)
    } catch (err) {
      console.error("Delete post failed", err);
      alert("삭제 실패");
    }
  };

  // 6. 댓글 삭제 (본인 댓글인 경우만)
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${backendUrl}/api/comments/${commentId}?userKey=${userInfo.userKey}`);
      // 화면에서 즉시 안 보이게 하기 위해, 삭제된 ID만 쏙 뺀 새 배열로 교체합니다 (filter 함수 사용).
      setComments(comments.filter(c => c.commentKey !== commentId));
    } catch (err) {
      console.error("Delete comment failed", err);
    }
  };

  // ============================================================================
  // 렌더링 준비 (계층형 댓글 구조 만들기)
  // ============================================================================
  // 서버에서 받은 댓글은 그냥 평평한 리스트(flat list)입니다.
  // 이를 '부모 댓글'과 '대댓글'로 나눠서 화면에 그려야 합니다.
  
  // 1. 부모가 없는 최상위 댓글들만 골라냅니다.
  const rootComments = comments.filter(c => !c.parentKey);
  
  // 2. 특정 부모 ID를 가진 자식 댓글들만 찾아주는 함수를 만듭니다.
  const getReplies = (parentId) => comments.filter(c => c.parentKey === parentId);

  return (
    <div style={styles.card}>
      {/* --- 헤더: 작성자 정보와 글 삭제 버튼 --- */}
      <div style={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div style={styles.avatar}>
             {/* 프로필 사진이 있으면 보여주고, 없으면 회색 원 */}
             {post.profileImage && <img src={`http://127.0.0.1:5000${post.profileImage}`} alt="User" style={styles.avatarImg} />}
            </div>
            {/* 아이디 클릭 시 프로필 페이지로 이동 */}
            <Link to={`/profile/${formatUsername(post.userID)}`} style={styles.usernameLink}>
            <span style={styles.username}>{formatUsername(post.userID)}</span>
            </Link>
        </div>
        {/* 조건부 렌더링: 로그인한 사람(userInfo)이 글쓴이(post.userKey)와 같을 때만 쓰레기통 아이콘 표시 */}
        {String(post.userKey) === String(userInfo.userKey) && (
            <button onClick={handleDeletePost} style={styles.deleteBtn}>
                🗑️
            </button>
        )}
      </div>

      {/* --- 메인 이미지 --- */}
      <img 
        src={imageUrl} 
        alt="Post" 
        style={styles.image} 
        // 이미지가 깨지거나 없을 때 대체 이미지를 보여주는 트릭
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/470?text=Image+Not+Found'; }}
      />
      
      {/* --- 액션 버튼들 (좋아요 등) --- */}
      <div style={styles.actions}>
         <button onClick={handleLike} style={styles.btn}>
            {/* SVG 아이콘: isLiked가 true면 빨간 하트, false면 빈 하트 */}
            {isLiked ? (
               <svg aria-label="Unlike" color="#ed4956" fill="#ed4956" height="24" viewBox="0 0 48 48" width="24">
                  <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"></path>
               </svg>
            ) : (
               <svg aria-label="Like" color="#262626" fill="#262626" height="24" viewBox="0 0 24 24" width="24">
                  <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.956-5.197 7.221-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z"></path>
               </svg>
            )}
         </button>
      </div>
      
      {/* --- 본문 내용 (좋아요 수, 작성자 글, 날짜) --- */}
      <div style={styles.content}>
        <div style={styles.likes}>{likeCount} likes</div>
        <div>
           <Link to={`/profile/${formatUsername(post.userID)}`} style={styles.usernameLink}>
              <span style={styles.username}>{formatUsername(post.userID)}</span>
           </Link>
           <span style={styles.caption}> {post.content}</span>
        </div>
        
        {/* 날짜 표시: 서버에서 이미 KST로 포맷팅된 문자열이 오므로 파싱해서 예쁘게 보여줍니다. */}
        <div style={styles.date}>
          {(() => {
            if (!post.postingDate) return '';
            const datePart = post.postingDate.split('T')[0]; // "2026-01-01T..." -> "2026-01-01"
            const [year, month, day] = datePart.split('-');
            return `${year}. ${Number(month)}. ${Number(day)}.`;
          })()}
        </div>
      </div>

      {/* --- 댓글 섹션 --- */}
      {comments.length > 0 && (
         <div style={styles.commentsSection}>
             {/* 1. 최상위(부모) 댓글들을 먼저 그립니다. */}
             {rootComments.map(comment => {
               // 이 댓글에 달린 대댓글(자식들)을 가져옵니다.
               const replies = getReplies(comment.commentKey);
               
               return (
                <div key={comment.commentKey}>
                    {/* 부모 댓글 렌더링 */}
                    <div style={styles.commentRow}>
                        <div style={{ wordBreak: 'break-word', marginRight: '5px' }}>
                            <Link to={`/profile/${formatUsername(comment.userID)}`} style={{...styles.usernameLink, marginRight: '5px'}}>
                               <span style={styles.commentUser}>{formatUsername(comment.userID)}</span>
                            </Link>
                            <span style={styles.commentText}>{comment.content}</span>
                            {/* Reply 버튼 클릭 시 이 댓글이 부모가 됩니다. */}
                            <button onClick={() => handleReply(comment)} style={styles.replyBtn}>Reply</button>
                        </div>
                        {/* 내 댓글인 경우 삭제 버튼 */}
                        {String(comment.userKey) === String(userInfo.userKey) && (
                            <button onClick={() => handleDeleteComment(comment.commentKey)} style={styles.commentDeleteBtn}>
                                ✕
                            </button>
                        )}
                    </div>
                
                    {/* 2. 대댓글(자식들) 렌더링 (들여쓰기 적용) */}
                    {replies.length > 0 && replies.map(reply => (
                        // paddingLeft: '20px'로 들여쓰기 효과를 줍니다.
                        <div key={reply.commentKey} style={{...styles.commentRow, paddingLeft: '20px'}}>
                            <div style={{ wordBreak: 'break-word', marginRight: '5px' }}>
                                <Link to={`/profile/${formatUsername(reply.userID)}`} style={{...styles.usernameLink, marginRight: '5px'}}>
                                    <span style={styles.commentUser}>{formatUsername(reply.userID)}</span>
                                </Link>
                                <span style={styles.commentText}>{reply.content}</span>
                            </div>
                            {String(reply.userKey) === String(userInfo.userKey) && (
                                <button onClick={() => handleDeleteComment(reply.commentKey)} style={styles.commentDeleteBtn}>
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
               );
             })}
         </div>
      )}

      {/* --- 댓글 입력창 --- */}
      <div style={styles.commentInputContainer}>
         {/* 답글 모드일 때만 보이는 상단 알림 바 */}
         {replyTarget && (
            <div style={styles.replyIndicator}>
                Replying to {replyTarget.username} 
                <button onClick={cancelReply} style={styles.cancelReplyBtn}>Cancel</button>
            </div>
         )}
         <form onSubmit={handleCommentSubmit} style={styles.commentForm}>
            <input 
               type="text" 
               placeholder={replyTarget ? `Reply to ${replyTarget.username}...` : "Add a comment..."}
               value={commentInput}
               onChange={(e) => setCommentInput(e.target.value)}
               style={styles.commentInput}
            />
            {/* 내용이 없으면 버튼 비활성화 (disabled) */}
            <button type="submit" disabled={!commentInput.trim()} style={styles.postBtn}>Post</button>
         </form>
      </div>
    </div>
  );
}

// CSS 스타일 (Inline Style)
const styles = {
  card: {
    backgroundColor: '#fff',
    border: '1px solid #DBDBDB',
    borderRadius: '3px',
    marginBottom: '20px',
    width: '470px', // 인스타그램의 전형적인 카드 너비
  },
  header: {
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  deleteBtn: {
     background: 'none',
     border: 'none',
     cursor: 'pointer',
     fontSize: '14px',
     marginLeft: 'auto', // 우측 끝으로 밀어넣기
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#efefef',
    border: '1px solid #dbdbdb',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  username: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  usernameLink: {
     textDecoration: 'none',
     color: 'inherit',
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  actions: {
    padding: '12px 16px 8px',
  },
  btn: {
    padding: 0,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  content: {
    padding: '0 16px',
    fontSize: '14px',
  },
  likes: {
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  caption: {
    color: '#262626',
    marginLeft: '5px',
  },
  commentsSection: {
    borderTop: '1px solid #efefef',
    padding: '10px 16px',
    backgroundColor: '#FAFAFA', 
  },
  commentRow: {
    marginBottom: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentDeleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#ed4956', 
    fontSize: '12px',
    marginLeft: '5px',
    fontWeight: 'bold',
  },
  replyBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '10px',
      color: '#8e8e8e',
      marginLeft: '8px',
      fontWeight: '600'
  },
  replyIndicator: {
      fontSize: '12px',
      color: '#8e8e8e',
      marginBottom: '5px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
  },
  cancelReplyBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#ed4956',
      fontSize: '12px',
      fontWeight: 'bold'
  },
  commentUser: {
    fontWeight: 'bold',
    marginRight: '5px',
  },
  commentText: {
    color: '#262626',
  },
  date: {
    marginTop: '8px',
    fontSize: '10px',
    color: '#8E8E8E',
    textTransform: 'uppercase',
    marginBottom: '16px',
  },
  commentInputContainer: {
    borderTop: '1px solid #efefef',
    padding: '12px 16px',
  },
  commentForm: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  commentInput: {
    border: 'none',
    width: '100%',
    outline: 'none',
    fontSize: '14px',
  },
  postBtn: {
    color: '#0095F6',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  }
};

export default PostCard;
