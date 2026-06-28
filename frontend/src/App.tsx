import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Lessons from './pages/Lessons'
import LessonView from './pages/LessonView'
import Roadmap from './pages/Roadmap'
import Playground from './pages/Playground'
import DatabaseViewer from './pages/DatabaseViewer'
import DataFlow from './pages/DataFlow'
import RagDemo from './pages/RagDemo'
import Resources from './pages/Resources'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="clay-container clay-main">
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
