import {Outlet, Route, Routes} from "react-router";
import Navbar from "./components/NavBar.jsx";

const App = () => {
    return (
        <div>
            <Navbar />
            <Outlet/>
        </div>
    );
};
export default App;