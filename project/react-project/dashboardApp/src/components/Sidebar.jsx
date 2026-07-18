import './Sidebar.css'

function Sidebar() {
  return (
    <aside className="dashboard-sidebar">
      <nav aria-label="Dashboard navigation">
        <ul>
          <li>
            <a className="is-active" href="#home">
              Home
            </a>
          </li>
          <li>
            <a href="#profile">Profile</a>
          </li>
          <li>
            <a href="#settings">Settings</a>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
