import { useState, useRef } from 'react';
import axios from 'axios';
import { formatUsername } from '../utils';

// ==============================================================================
// 게시물 작성 모달 (CreatePostModal)
// ==============================================================================
// 'Create New Post' 버튼을 눌렀을 때 뜨는 팝업창입니다.
// 이미지 미리보기, 드래그 앤 드롭, 캡션 입력 기능을 제공합니다.
function CreatePostModal({ onClose, userInfo }) {
  const [file, setFile] = useState(null); // 선택된 파일 객체
  const [preview, setPreview] = useState(null); // 미리보기 이미지 URL (blob:...)
  const [caption, setCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false); // 드래그 중인지 여부 (스타일 변경용)
  
  const fileInputRef = useRef(null); // 숨겨진 input 태그를 조작하기 위한 Ref

  // ============================================================================
  // 파일 처리 로직 (드래그 앤 드롭 & 파일 선택 공통)
  // ============================================================================
  const handleFile = (selectedFile) => {
      if (selectedFile && selectedFile.type.startsWith('image/')) {
          setFile(selectedFile);
          // 브라우저 메모리에 임시 URL을 만들어서 미리보기를 보여줍니다.
          setPreview(URL.createObjectURL(selectedFile));
      } else {
          alert("이미지 파일만 업로드 가능합니다.");
      }
  };

  // onDrop: 파일을 박스 안에 떨어뜨렸을 때
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };
  
  // onDragOver: 파일을 잡고 박스 위로 올라왔을 때
  const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true); // 배경색 변경 등을 위해 State On
  };

  const handleDragLeave = () => {
      setIsDragging(false);
  };

  // 'Select from computer' 버튼 클릭 시 숨겨진 input을 클릭한 효과를 냄
  const handleButtonClick = () => {
      fileInputRef.current.click(); 
  };

  const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      handleFile(selectedFile);
  };

  // ============================================================================
  // 게시물 전송 (Submit)
  // ============================================================================
  const handleSubmit = async () => {
    if (!file) return alert("사진을 선택해주세요.");

    // 파일 전송을 위한 FormData 생성
    const formData = new FormData();
    formData.append('image', file);
    formData.append('content', caption);
    formData.append('userKey', userInfo.userKey);
    formData.append('userID', userInfo.userID);

    try {
      await axios.post('http://127.0.0.1:5000/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("게시물이 등록되었습니다!");
      onClose(); // 모달 닫기
      window.location.reload(); // 피드 갱신
    } catch (err) {
      console.error(err);
      alert("업로드 실패");
    }
  };

  return (
    <div style={styles.overlay}>
      {/* 바깥 배경을 클릭해도 모달이 닫히도록 함 */}
      <button style={styles.closeBtn} onClick={onClose}>✕</button>
      
      <div style={styles.modal}>
        <div style={styles.header}>Create new post</div>
        
        <div style={styles.body}>
          {/* 이미지가 선택되지 않은 경우: 업로드 화면 표시 */}
          {!preview ? (
            <div 
                style={{
                    ...styles.uploadArea,
                    backgroundColor: isDragging ? '#FAFAFA' : '#FFF'
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
               <svg aria-label="Icon to represent media such as images or videos" color="#262626" fill="#262626" height="77" role="img" viewBox="0 0 97.6 77.3" width="96">
                  <path d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm32.4 27.3c-1.1 0-2.1-.4-2.8-1.3L33.2 29.4c-1.5-1.9-4.5-1.9-6 0L2.7 58.1c-.8.9-1.1 2.1-.8 3.2.3 1.1 1.1 2 2.2 2.4 1 .4 2.1.2 3-.4l22.4-23.9 14.5 18.5c.8 1 2 1.6 3.3 1.6 1.3 0 2.5-.6 3.3-1.6l23.5-30.1 20 27.6c.8 1.1 2.2 1.5 3.5 1.1 1.3-.4 2.2-1.5 2.4-2.8.1-1.3-.6-2.5-1.6-3.2L68.7 20.6c-1.5-2.1-4.7-2.1-6.2 0L45.9 50z"></path>
               </svg>
               <p style={{fontSize: '22px', marginTop: '10px'}}>Drag photos and videos here</p>
               
               <button onClick={handleButtonClick} style={styles.selectBtn}>Select from computer</button>
               <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{display: 'none'}} 
                    onChange={handleFileChange}
                    accept="image/*"
               />
            </div>
          ) : (
            // 이미지가 선택된 경우: 미리보기 + 글쓰기 화면 표시
            <div style={styles.previewArea}>
                <div style={styles.imageSection}>
                    <img src={preview} alt="Preview" style={styles.previewImage} />
                </div>
                <div style={styles.captionSection}>
                    <div style={styles.userInfo}>
                        <strong>{formatUsername(userInfo.userID)}</strong>
                    </div>
                    <textarea 
                        placeholder="Write a caption..." 
                        style={styles.textarea}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                    />
                    <div style={styles.shareRow}>
                        <button onClick={handleSubmit} style={styles.shareBtn}>Share</button>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '30px',
    cursor: 'pointer',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '750px', // 가로로 넓게 (이미지+글쓰기)
    height: '500px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    borderBottom: '1px solid #DBDBDB',
    textAlign: 'center',
    padding: '10px',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  body: {
    flex: 1,
    display: 'flex',
  },
  uploadArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
  },
  selectBtn: {
      marginTop: '20px',
      backgroundColor: '#0095F6',
      color: '#fff',
      padding: '5px 9px',
      borderRadius: '4px',
      fontWeight: 'bold',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px'
  },
  previewArea: {
      display: 'flex',
      width: '100%',
      height: '100%',
  },
  imageSection: {
      width: '60%',
      backgroundColor: '#000',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
  },
  previewImage: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
  },
  captionSection: {
      width: '40%',
      borderLeft: '1px solid #DBDBDB',
      display: 'flex',
      flexDirection: 'column',
  },
  userInfo: {
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
  },
  textarea: {
      flex: 1,
      border: 'none',
      resize: 'none',
      padding: '0 16px',
      fontSize: '16px',
      fontFamily: 'inherit',
      outline: 'none',
  },
  shareRow: {
      padding: '10px 16px',
      borderTop: '1px solid #DBDBDB',
      display: 'flex',
      justifyContent: 'flex-end',
  },
  shareBtn: {
      color: '#0095F6',
      fontWeight: 'bold',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
  },
};

export default CreatePostModal;
