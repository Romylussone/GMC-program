import { useState, createContext } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import NavBar from './components/NavBar'
import Content from './components/Content'

export const Store = createContext()

function App() {
  const [isEnglish, setIsEnglish] = useState(true)

  return (
    <Store.Provider value={{ isEnglish, setIsEnglish }}>
      <NavBar />
      <Content />
    </Store.Provider>
  )
}

export default App
