import "../styles/NavBar.css";

// navigation bar to dishes or calendar page (dishes page = default)
export default function Navbar() {
    return (
        <nav className="nav">
            <ul>
                <li>
                    <a href="/">Dishes</a>
                </li>
                <li>
                    <a href="/calendar">Calendar</a>
                </li>
            </ul>
        </nav>
    );
}