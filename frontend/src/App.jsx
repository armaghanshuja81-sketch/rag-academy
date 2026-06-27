import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Lessons from './pages/Lessons.jsx'
import LessonView from './pages/LessonView.jsx'
import Roadmap from './pages/Roadmap.jsx'
import Playground from './pages/Playground.jsx'
import DatabaseViewer from './pages/DatabaseViewer.jsx'
import DataFlow from './pages/DataFlow.jsx'
import RagDemo from './pages/RagDemo.jsx'
import Resources from './pages/Resources.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="clay-container" style={{ minHeight: 'calc(100vh - 64px - 100px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lesson/:id" element={<LessonView />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/database" element={<DatabaseViewer />} />
          <Route path="/data-flow" element={<DataFlow />} />
          <Route path="/rag-demo" element={<RagDemo />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
