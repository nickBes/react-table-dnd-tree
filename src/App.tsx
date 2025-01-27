import { HeroUIProvider } from "@heroui/react";
import "./App.css";
import { SortableEmployeeTree } from "./components/Tree/SortableEmployeeTree";
import { Employee } from "./components/Tree/types";

const employees: Employee[] = [
  {
    id: "1",
    name: "Alice Johnson",
    position: "CEO",
    department: "Executive",
    managerId: null,
  },
  {
    id: "2",
    name: "Bob Smith",
    position: "CTO",
    department: "Technology",
    managerId: "1",
  },
  {
    id: "3",
    name: "Sophie Taylor",
    position: "CFO",
    department: "Finance",
    managerId: "1",
  },
  {
    id: "4",
    name: "Michael Davis",
    position: "COO",
    department: "Operations",
    managerId: "1",
  },
  {
    id: "5",
    name: "Carol White",
    position: "Lead Developer",
    department: "Technology",
    managerId: "2",
  },
  {
    id: "6",
    name: "George Miller",
    position: "Accountant",
    department: "Finance",
    managerId: "3",
  },
  {
    id: "7",
    name: "Rachel Green",
    position: "Operations Manager",
    department: "Operations",
    managerId: "4",
  },
  {
    id: "8",
    name: "David Brown",
    position: "Frontend Developer",
    department: "Technology",
    managerId: "5",
  },
  {
    id: "9",
    name: "Emma Wilson",
    position: "Backend Developer",
    department: "Technology",
    managerId: "5",
  },
];

function App() {
  return (
    <HeroUIProvider>
      <SortableEmployeeTree initialEmployees={employees} />
    </HeroUIProvider>
  );
}

export default App;
