import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import NewTask from "./pages/NewTask";
import OrderChat from "./pages/OrderChat";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/new-task" element={<NewTask />} />
      <Route path="/orders/:code" element={<OrderChat />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
