import type { MutableRefObject } from "react";
import { Row } from "@tanstack/react-table";

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  managerId: string | null;
}

export interface EmployeeNode extends Employee {
  subordinates: EmployeeNode[];
}

export type SensorContext = MutableRefObject<{
  items: Row<EmployeeNode>[];
  offset: number;
}>;
