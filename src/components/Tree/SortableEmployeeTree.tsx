import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  MeasuringStrategy,
  DropAnimation,
  defaultDropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { buildEmployeeTree, getProjection } from "./utilities";
import type { Employee, EmployeeNode, SensorContext } from "./types";
import { CSS } from "@dnd-kit/utilities";
import { SortableEmployee } from "./SortableEmployee";
import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Chip } from "@heroui/react";

const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
    ];
  },
  easing: "ease-out",
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    });
  },
};

interface Props {
  initialEmployees: Employee[];
  indentationWidth?: number;
}

export function SortableEmployeeTree({
  initialEmployees,
  indentationWidth = 50,
}: Props) {
  const [employees, setEmployees] = useState(() => initialEmployees);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const columnHelper = createColumnHelper<EmployeeNode>();

  const columns = useMemo(
    () => [
      columnHelper.accessor(({ id }) => id, {
        id: "title",
        cell: ({ getValue }) => <Chip>{getValue()}</Chip>,
      }),
    ],
    [columnHelper]
  );

  const employeeTree = useMemo(() => buildEmployeeTree(employees), [employees]);

  const table = useReactTable({
    columns,
    data: employeeTree,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: ({ id }) => id,
    getSubRows: ({ subordinates }) => subordinates,
  });

  const projected =
    activeId && overId
      ? getProjection(
          table.getRowModel().rows,
          activeId,
          overId,
          offsetLeft,
          indentationWidth
        )
      : null;

  const sensorContext: SensorContext = useRef({
    items: table.getRowModel().rows,
    offset: offsetLeft,
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const activeItem = activeId ? table.getRow(activeId) : null;

  useEffect(() => {
    sensorContext.current = {
      items: table.getRowModel().rows,
      offset: offsetLeft,
    };
  }, [table, offsetLeft]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={table.getRowModel().rows}
        strategy={verticalListSortingStrategy}
      >
        {table
          .getRowModel()
          .rows.map(
            ({
              id,
              getIsExpanded,
              getCanExpand,
              getToggleExpandedHandler,
              depth,
              original,
            }) => (
              <SortableEmployee
                key={id}
                id={id}
                value={original.name}
                depth={id === activeId && projected ? projected.depth : depth}
                indentationWidth={indentationWidth}
                collapsed={getIsExpanded()}
                onCollapse={
                  getCanExpand() ? getToggleExpandedHandler() : undefined
                }
                onRemove={() => handleRemove(id)}
              />
            )
          )}
        {createPortal(
          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeId && activeItem ? (
              <SortableEmployee
                id={activeId}
                depth={activeItem.depth}
                clone
                childCount={table.getRow(activeId).subRows.length}
                value={activeId.toString()}
                indentationWidth={indentationWidth}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  );

  function handleDragStart({ active: { id: activeId } }: DragStartEvent) {
    setActiveId(activeId.toString());
    setOverId(activeId.toString());
    table.getRow(activeId.toString()).toggleExpanded(false);

    document.body.style.setProperty("cursor", "grabbing");
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over?.id.toString() ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    resetState();

    if (projected && over && active.id.toString() !== over.id.toString()) {
      const { parentId } = projected;
      const nextEmployees = [...employees];

      const activeIndex = nextEmployees.findIndex(
        ({ id }) => id === active.id,
        toString()
      );
      const activeEmployee = nextEmployees[activeIndex];

      nextEmployees[activeIndex] = {
        ...activeEmployee,
        managerId: parentId ?? null,
      };

      setEmployees(nextEmployees);
    }
  }

  function handleDragCancel() {
    resetState();
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);

    document.body.style.setProperty("cursor", "");
  }

  function handleRemove(employeeId: string) {
    setEmployees((prevEmployees) => {
      const indexOfEmployee = prevEmployees.findIndex(
        ({ id }) => id === employeeId
      );

      if (indexOfEmployee === -1) return prevEmployees;

      const nextEmployees = [...prevEmployees];

      nextEmployees.splice(indexOfEmployee, 1);

      return nextEmployees;
    });
  }
}
