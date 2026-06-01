"use client";

import { useState } from "react";
import {
  AlignLeft,
  AlignJustify,
  AtSign,
  Phone,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  Upload,
  Star,
  ToggleLeft,
  Plus,
  Eye,
  Rocket,
  Settings,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InterfaceLayout } from "./interface-layout";

interface FieldType {
  id: string;
  label: string;
  icon: React.ElementType;
}

const FIELD_TYPES: FieldType[] = [
  { id: "short-text", label: "Short text", icon: AlignLeft },
  { id: "long-text", label: "Long text", icon: AlignJustify },
  { id: "email", label: "Email", icon: AtSign },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "number", label: "Number", icon: Hash },
  { id: "date", label: "Date", icon: Calendar },
  { id: "dropdown", label: "Dropdown", icon: ChevronDown },
  { id: "multi-select", label: "Multi-select", icon: CheckSquare },
  { id: "file-upload", label: "File upload", icon: Upload },
  { id: "rating", label: "Rating", icon: Star },
  { id: "yes-no", label: "Yes / No", icon: ToggleLeft },
];

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
}

function FieldsPanel({
  onAddField,
}: {
  onAddField: (type: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Add field
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {FIELD_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onAddField(id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted/60 transition-colors text-left"
          >
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PropertiesPanel({ field }: { field: FormField | null }) {
  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-2">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-1">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No field selected</p>
        <p className="text-xs text-muted-foreground">
          Click a field on the canvas to edit its properties.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Properties
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Label</label>
          <input
            defaultValue={field.label}
            className="w-full px-3 py-1.5 text-sm bg-muted/30 border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Placeholder</label>
          <input
            placeholder="e.g. Type here…"
            className="w-full px-3 py-1.5 text-sm bg-muted/30 border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Required</span>
          <div
            className={cn(
              "w-9 h-5 rounded-full transition-colors cursor-pointer",
              field.required ? "bg-foreground" : "bg-muted",
            )}
          >
            <div
              className={cn(
                "h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5",
                field.required ? "translate-x-4.5 ml-0.5" : "translate-x-0.5 ml-0",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyCanvas({ onAddField }: { onAddField: (type: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="h-14 w-14 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
        <Plus className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">No fields yet</p>
        <p className="text-xs text-muted-foreground">
          Add your first field from the panel on the left.
        </p>
      </div>
      <button
        onClick={() => onAddField("short-text")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add short text
      </button>
    </div>
  );
}

function FieldCard({
  field,
  selected,
  onSelect,
}: {
  field: FormField;
  selected: boolean;
  onSelect: () => void;
}) {
  const fieldType = FIELD_TYPES.find((f) => f.id === field.type);
  const Icon = fieldType?.icon ?? AlignLeft;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-white text-left transition-all duration-150 group",
        selected
          ? "border-foreground ring-1 ring-foreground shadow-sm"
          : "border-border hover:border-gray-300 hover:shadow-sm",
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" />
      <div className="h-8 w-8 rounded-lg bg-muted/40 border flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{field.label}</p>
        <p className="text-xs text-muted-foreground">{fieldType?.label ?? field.type}</p>
      </div>
      {field.required && (
        <span className="text-[10px] font-medium text-red-500 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
          Required
        </span>
      )}
    </button>
  );
}

export function FormInterface({ onBack }: { onBack: () => void }) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addField = (type: string) => {
    const fieldType = FIELD_TYPES.find((f) => f.id === type);
    const newField: FormField = {
      id: `f-${Date.now()}`,
      type,
      label: fieldType?.label ?? "New field",
      required: false,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedId(newField.id);
  };

  const selectedField = fields.find((f) => f.id === selectedId) ?? null;

  return (
    <InterfaceLayout
      label="Form"
      onBack={onBack}
      leftPanel={<FieldsPanel onAddField={addField} />}
      leftPanelWidth={220}
      rightPanel={<PropertiesPanel field={selectedField} />}
      rightPanelWidth={280}
      actions={
        <>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted transition-colors">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors font-medium">
            <Rocket className="h-3.5 w-3.5" />
            Publish
          </button>
        </>
      }
    >
      <div className="flex flex-col h-full bg-muted/20">
        {/* Canvas header */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
          <p className="text-xs font-medium text-muted-foreground">
            {fields.length} {fields.length === 1 ? "field" : "fields"}
          </p>
          {fields.length > 0 && (
            <button
              onClick={() => addField("short-text")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add field
            </button>
          )}
        </div>

        {/* Canvas body */}
        {fields.length === 0 ? (
          <EmptyCanvas onAddField={addField} />
        ) : (
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-xl mx-auto space-y-3">
              {fields.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  selected={selectedId === field.id}
                  onSelect={() => setSelectedId(field.id)}
                />
              ))}
              <button
                onClick={() => addField("short-text")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground hover:border-gray-400 hover:text-foreground hover:bg-white transition-all"
              >
                <Plus className="h-4 w-4" />
                Add field
              </button>
            </div>
          </div>
        )}
      </div>
    </InterfaceLayout>
  );
}
