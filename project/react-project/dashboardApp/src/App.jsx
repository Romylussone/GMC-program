import './App.css'
import Content from './components/Content'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

function App() {
  return (
    <div className="dashboard-app">
      <Header />
      <div className="dashboard-layout">
        <Sidebar />
        <Content />
      </div>
    </div>
  )
}

export default App
