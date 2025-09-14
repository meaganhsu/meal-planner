import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import Authentication from './components/Authentication.jsx';
import App from './App';
import DishList from './components/DishList';
import Dish from './components/Dish';
import Calendar from './components/Calendar';
import './styles/index.css';

const router = createBrowserRouter([
    {
        path: "/",
        element: <Authentication />,
        children: [
            {
                path: "/",
                element: <App />,
                children: [
                    {
                        path: "/",
                        element: <DishList />,
                    },
                    {
                        path: "create",
                        element: <Dish />,
                    },
                    {
                        path: "edit/:id",
                        element: <Dish />,
                    },
                    {
                        path: "calendar",
                        element: <Calendar />,
                    },
                ],
            },
        ],
    },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);