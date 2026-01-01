import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ==============================================================================
// React 앱의 진입점 (Entry Point)
// ==============================================================================
// 웹 페이지가 열리면 가장 먼저 실행되는 파일입니다.
// index.html 파일에 있는 <div id="root"></div> 요소를 찾아서,
// 그 안에 우리의 리액트 앱(<App />)을 렌더링(그리기) 합니다.

createRoot(document.getElementById('root')).render(
  // StrictMode: 개발 모드에서 잠재적인 버그를 잡기 위해 컴포넌트를 두 번씩 실행해보는 도구
  <StrictMode>
    <App />
  </StrictMode>,
)
