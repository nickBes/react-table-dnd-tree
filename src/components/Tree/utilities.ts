import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Employee, EmployeeNode } from "./types";
import { Row } from "@tanstack/react-table";

export function buildEmployeeTree(employees: Employee[]): EmployeeNode[] {
  const employeeMap = employees.reduce(
    (acc, employee) => ({
      ...acc,
      [employee.id]: { ...employee, subordinates: [] },
    }),
    {} as Record<string, EmployeeNode>
  );

  const employeeTree: EmployeeNode[] = [];

  employees.forEach(({ id, managerId }) => {
    if (!managerId || !(managerId in employeeMap)) {
      employeeTree.push(employeeMap[id]);
    } else if (managerId) {
      employeeMap[managerId].subordinates.push(employeeMap[id]);
    }
  });

  return employeeTree;
}

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(
  items: Row<EmployeeNode>[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const maxDepth = previousItem?.depth ?? -1 + 1;
  const minDepth = nextItem?.depth ?? 0;
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return { depth, maxDepth, minDepth, parentId: getParentId() };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}
