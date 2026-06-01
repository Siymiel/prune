"use client";

import { useState, useRef, useEffect } from "react";
import {
  Check,
  Code2,
  LayoutList,
  MessageCircle,
  MessageSquare,
  Table2,
  Copy,
  Download,
  MoreHorizontal,
  FilePlus2,
  RotateCcw,
  Boxes,
  HopIcon,
  ChevronDown,
  Info,
  Pencil,
  Trash2,
  List,
  ListOrdered,
  Code,
  Link,
  ImagePlus,
  Quote,
  X,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterfaceId =
  | "form"
  | "chat-assistant"
  | "website-chatbot"
  | "batch"
  | "api"
  | "slack-app"
  | "microsoft-teams";

interface InterfaceOption {
  id: InterfaceId;
  label: string;
  icon: React.ElementType;
  deprecated?: boolean;
}

interface FormField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: "textarea" | "file";
}

interface OutputField {
  id: string;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_INTERFACES: InterfaceOption[] = [
  { id: "form", label: "Form", icon: LayoutList },
  { id: "chat-assistant", label: "Chat Assistant", icon: MessageSquare },
  { id: "website-chatbot", label: "Website Chatbot", icon: MessageCircle },
  { id: "batch", label: "Batch", icon: Table2 },
];

const API_INTERFACES: InterfaceOption[] = [{ id: "api", label: "API", icon: Code2 }];

const STORAGE_KEY_FIELDS = "prune-form-fields";
const STORAGE_KEY_OUTPUTS = "prune-form-outputs";

const DEFAULT_FIELDS: FormField[] = [
  {
    id: "user-question",
    label: "User Question",
    placeholder: "Type something...",
    required: false,
    type: "textarea",
  },
  {
    id: "files",
    label: "Files",
    placeholder: "",
    required: false,
    type: "file",
  },
];

const DEFAULT_OUTPUTS: OutputField[] = [
  { id: "final-answer", label: "Final Answer" },
];

// ─── Tooltip helper ───────────────────────────────────────────────────────────

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-foreground" : "bg-gray-200",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <span className="text-[15px] font-[450] text-foreground">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Image upload modal ───────────────────────────────────────────────────────

function ImageUploadModal({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center gap-3 hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag &amp; drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
            </div>
            <span className="px-4 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-muted transition-colors mt-1">
              Browse files
            </span>
          </div>
          <input type="file" accept="image/*" className="sr-only" />
        </label>
      </div>
    </div>
  );
}

// ─── Field edit panel (live) ──────────────────────────────────────────────────

function FieldEditPanel({
  field,
  onClose,
  onChange,
}: {
  field: FormField;
  onClose: () => void;
  onChange: (patch: Partial<FormField>) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-[53px] border-b shrink-0">
        <h3 className="text-base font-bold text-foreground">Form Block Settings</h3>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Label</label>
          <input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Placeholder</label>
          <input
            value={field.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Required</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange({ required: true })}
              className={cn(
                "px-5 py-1.5 text-sm rounded-md border transition-colors",
                field.required
                  ? "bg-white border-gray-400 font-medium text-foreground"
                  : "bg-gray-100 border-gray-200 text-muted-foreground",
              )}
            >
              Yes
            </button>
            <button
              onClick={() => onChange({ required: false })}
              className={cn(
                "px-5 py-1.5 text-sm rounded-md border transition-colors",
                !field.required
                  ? "bg-white border-gray-400 font-medium text-foreground"
                  : "bg-gray-100 border-gray-200 text-muted-foreground",
              )}
            >
              No
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Multiple Choice</label>
          <div className="flex items-center gap-2">
            <input
              placeholder="Add a new option"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-white placeholder:text-muted-foreground"
            />
            <button className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-muted transition-colors text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Editable field row ───────────────────────────────────────────────────────

function EditableFieldRow({
  field,
  isEditing,
  onEdit,
  onDelete,
  isDragging,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  field: FormField;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "group relative rounded-xl -mx-4 px-4 py-3 transition-all",
        isEditing ? "bg-gray-50 ring-1 ring-gray-200" : "hover:bg-gray-50",
        isDragging && "opacity-40 scale-[0.98]",
      )}
    >
      {/* Drag handle — top-left on hover */}
      <div className="absolute left-0.5 top-3.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
      </div>

      {/* Row header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{field.label}</span>
        <div className="flex items-center gap-1">
          <Tip label="Edit field">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-muted transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </Tip>
          <Tip label="Delete field">
            <button
              onClick={onDelete}
              className="h-7 w-7 flex items-center text-red-400 justify-center rounded-md bg-white border border-gray-200 hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Tip>
        </div>
      </div>

      {/* Field content */}
      {field.type === "textarea" ? (
        <textarea
          readOnly
          placeholder={field.placeholder}
          className="w-full min-h-[80px] px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg resize-none placeholder:text-muted-foreground focus:outline-none"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-8 border border-dashed border-gray-300 rounded-lg bg-white text-center">
          <FilePlus2 className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Choose or drag and drop here</p>
          <p className="text-xs text-muted-foreground">Maximum file size of 20Mb</p>
        </div>
      )}
    </div>
  );
}

// ─── Draggable output row ─────────────────────────────────────────────────────

function DraggableOutputRow({
  output,
  isEditing,
  isDragging,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  output: OutputField;
  isEditing: boolean;
  isDragging: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "group relative rounded-xl -mx-4 px-4 py-3 transition-all",
        isEditing ? "bg-gray-50 ring-1 ring-gray-200" : "hover:bg-gray-50",
        isDragging && "opacity-40 scale-[0.98]",
      )}
    >
      {/* Drag handle */}
      <div className="absolute left-0.5 top-3.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground">{output.label}</label>
        <div className="flex items-center gap-1">
          <Tip label="Copy">
            <button className="h-7 w-7 flex items-center justify-center rounded-md bg-white border border-gray-200 hover:bg-muted text-muted-foreground transition-colors">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </Tip>
          <Tip label="Download">
            <button className="h-7 w-7 flex items-center justify-center rounded-md bg-white border border-gray-200 hover:bg-muted text-muted-foreground transition-colors">
              <Download className="h-3.5 w-3.5" />
            </button>
          </Tip>
          <Tip label="More options">
            <button className="h-7 w-7 flex items-center justify-center rounded-md bg-white border border-gray-200 hover:bg-muted text-muted-foreground transition-colors">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </Tip>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <Tip label="Edit output">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-muted transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </Tip>
          <Tip label="Delete output">
            <button
              onClick={onDelete}
              className="h-7 w-7 flex items-center justify-center rounded-md bg-white border border-gray-200 hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Tip>
        </div>
      </div>

      <textarea
        readOnly
        rows={6}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg resize-none focus:outline-none"
      />
    </div>
  );
}

// ─── Output edit panel ────────────────────────────────────────────────────────

function OutputEditPanel({
  output,
  onClose,
  onChange,
}: {
  output: OutputField;
  onClose: () => void;
  onChange: (patch: Partial<OutputField>) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-[53px] border-b shrink-0">
        <h3 className="text-base font-bold text-foreground">Output Block Settings</h3>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Label</label>
          <input
            value={output.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-white"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Editable form card ───────────────────────────────────────────────────────

function EditableFormCard({
  fields,
  outputs,
  appName,
  isEditingName,
  onEditName,
  onNameChange,
  onNameCommit,
  onShowCoverModal,
  onShowLogoModal,
  editingFieldId,
  onEditField,
  onDeleteField,
  editingOutputId,
  onEditOutput,
  onDeleteOutput,
  onReorderFields,
  onReorderOutputs,
}: {
  fields: FormField[];
  outputs: OutputField[];
  appName: string;
  isEditingName: boolean;
  onEditName: () => void;
  onNameChange: (v: string) => void;
  onNameCommit: () => void;
  onShowCoverModal: () => void;
  onShowLogoModal: () => void;
  editingFieldId: string | null;
  onEditField: (id: string) => void;
  onDeleteField: (id: string) => void;
  editingOutputId: string | null;
  onEditOutput: (id: string) => void;
  onDeleteOutput: (id: string) => void;
  onReorderFields: (fields: FormField[]) => void;
  onReorderOutputs: (outputs: OutputField[]) => void;
}) {
  const fieldDragItem = useRef<number | null>(null);
  const fieldDragOver = useRef<number | null>(null);
  const outputDragItem = useRef<number | null>(null);
  const outputDragOver = useRef<number | null>(null);
  const [fieldDraggingIdx, setFieldDraggingIdx] = useState<number | null>(null);
  const [outputDraggingIdx, setOutputDraggingIdx] = useState<number | null>(null);

  const handleFieldDragStart = (index: number) => {
    fieldDragItem.current = index;
    setFieldDraggingIdx(index);
  };
  const handleFieldDragEnter = (index: number) => {
    fieldDragOver.current = index;
  };
  const handleFieldDragEnd = () => {
    if (
      fieldDragItem.current !== null &&
      fieldDragOver.current !== null &&
      fieldDragItem.current !== fieldDragOver.current
    ) {
      const arr = [...fields];
      const [item] = arr.splice(fieldDragItem.current, 1);
      arr.splice(fieldDragOver.current, 0, item);
      onReorderFields(arr);
    }
    fieldDragItem.current = null;
    fieldDragOver.current = null;
    setFieldDraggingIdx(null);
  };

  const handleOutputDragStart = (index: number) => {
    outputDragItem.current = index;
    setOutputDraggingIdx(index);
  };
  const handleOutputDragEnter = (index: number) => {
    outputDragOver.current = index;
  };
  const handleOutputDragEnd = () => {
    if (
      outputDragItem.current !== null &&
      outputDragOver.current !== null &&
      outputDragItem.current !== outputDragOver.current
    ) {
      const arr = [...outputs];
      const [item] = arr.splice(outputDragItem.current, 1);
      arr.splice(outputDragOver.current, 0, item);
      onReorderOutputs(arr);
    }
    outputDragItem.current = null;
    outputDragOver.current = null;
    setOutputDraggingIdx(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Cover */}
      <div className="relative h-36 bg-gray-100 flex items-center justify-center">
        <button
          onClick={onShowCoverModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 border border-gray-200 rounded-lg text-xs font-medium hover:bg-white transition-colors shadow-sm"
        >
          <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
          Change Cover
        </button>
      </div>

      {/* App icon overlapping cover */}
      <div className="px-8 -mt-10 relative">
        <div className="relative inline-block">
          <div className="h-20 w-20 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center">
            <HopIcon className="h-10 w-10 text-foreground" />
          </div>
          <button
            onClick={onShowLogoModal}
            className="absolute bottom-0.5 right-0.5 h-5 w-5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center"
          >
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Editable name */}
      <div className="px-8 pt-3 pb-3 flex items-center gap-2">
        {isEditingName ? (
          <input
            autoFocus
            value={appName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameCommit}
            onKeyDown={(e) => e.key === "Enter" && onNameCommit()}
            className="text-2xl font-bold text-foreground bg-transparent border-b-2 border-foreground focus:outline-none w-full max-w-sm"
          />
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">{appName}</h1>
            <button
              onClick={onEditName}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="px-8 pb-5 space-y-1.5">
        <p className="text-sm text-muted-foreground">
          To add an input or output, click inside the editor and select one from the side panel.
        </p>
        <p className="text-sm text-muted-foreground">
          To run your workflow, just press &quot;Submit&quot; on the bottom right corner!
        </p>
      </div>

      {/* Inputs */}
      <div className="px-8 pb-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Inputs</h2>
        <p className="text-xs text-muted-foreground mb-4">
          You can edit the properties of an input by clicking the pencil icon on the top right
          corner of the block.
        </p>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <EditableFieldRow
              key={field.id}
              field={field}
              isEditing={editingFieldId === field.id}
              onEdit={() => onEditField(field.id)}
              onDelete={() => onDeleteField(field.id)}
              isDragging={fieldDraggingIdx === index}
              onDragStart={() => handleFieldDragStart(index)}
              onDragEnter={() => handleFieldDragEnter(index)}
              onDragEnd={handleFieldDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Outputs */}
      <div className="px-8 pb-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Outputs</h2>
        <div className="space-y-2">
          {outputs.map((output, index) => (
            <DraggableOutputRow
              key={output.id}
              output={output}
              isEditing={editingOutputId === output.id}
              isDragging={outputDraggingIdx === index}
              onEdit={() => onEditOutput(output.id)}
              onDelete={() => onDeleteOutput(output.id)}
              onDragStart={() => handleOutputDragStart(index)}
              onDragEnter={() => handleOutputDragEnter(index)}
              onDragEnd={handleOutputDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Formatting toolbar + Submit */}
      <div className="px-8 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {["B", "I"].map((label) => (
            <button
              key={label}
              className="h-7 w-7 flex items-center justify-center rounded text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
            >
              {label}
            </button>
          ))}
          {["H1", "H2", "H3"].map((label) => (
            <button
              key={label}
              className="h-7 px-1.5 flex items-center justify-center rounded text-[10px] font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              {label}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          {([List, ListOrdered, Quote, Code] as React.ElementType[]).map((Icon, i) => (
            <button
              key={i}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          {([Link, ImagePlus, Table2] as React.ElementType[]).map((Icon, i) => (
            <button
              key={i}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-md transition-colors">
            <RotateCcw className="h-3.5 w-3.5" />
            Result History
          </button>
          <button className="px-5 py-2 text-sm font-semibold bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Selector panel ───────────────────────────────────────────────────────────

function InterfaceCard({
  option,
  selected,
  onSelect,
}: {
  option: InterfaceOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 py-5 px-3 rounded-xl border bg-white transition-all duration-150 text-center",
        selected
          ? "border-foreground ring-1 ring-foreground shadow-sm"
          : "border-border hover:border-gray-300 hover:shadow-sm",
      )}
    >
      {selected && (
        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-foreground flex items-center justify-center">
          <Check className="h-3 w-3 text-background" />
        </span>
      )}
      <div className="h-12 w-12 rounded-xl bg-muted/40 border border-border flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-foreground leading-tight">{option.label}</span>
    </button>
  );
}

function SelectorSection({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: InterfaceOption[];
  selected: InterfaceId | null;
  onSelect: (id: InterfaceId) => void;
}) {
  return (
    <section>
      <p className="text-[14px] font-medium text-muted-foreground mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <InterfaceCard
            key={opt.id}
            option={opt}
            selected={selected === opt.id}
            onSelect={() => onSelect(opt.id)}
          />
        ))}
      </div>
    </section>
  );
}

function InterfaceSelectorPanel({
  selected,
  onSelect,
  onUse,
}: {
  selected: InterfaceId | null;
  onSelect: (id: InterfaceId) => void;
  onUse: () => void;
}) {
  return (
    <div className="w-[620px] shrink-0 border-l bg-background flex flex-col">
      <div className="px-5 h-[53px] border-b shrink-0 flex items-center">
        <h2 className="text-base font-semibold text-foreground">Select an interface type</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <SelectorSection
          title="User Interfaces"
          options={USER_INTERFACES}
          selected={selected}
          onSelect={onSelect}
        />
        <SelectorSection
          title="API Connections"
          options={API_INTERFACES}
          selected={selected}
          onSelect={onSelect}
        />
      </div>

      <div className="px-5 py-4 border-t shrink-0">
        <button
          disabled={!selected}
          onClick={onUse}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
            selected
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          <Check className="h-4 w-4" />
          Use this interface
        </button>
      </div>
    </div>
  );
}

// ─── Form preview (selector stage) ───────────────────────────────────────────

function FormPreview() {
  return (
    <div className="flex flex-col h-full relative z-10 bg-background shadow-md">
      <div className="px-5 h-[53px] border-b bg-background shrink-0 flex items-center gap-2">
        <LayoutList className="h-5 w-5 text-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground">Form</span>
        <div className="w-px h-4 bg-border" />
        <span className="text-[14px] font-[450] text-muted-foreground">
          Use a powerful editor to customize your form
        </span>
      </div>

      <div className="relative flex-1 overflow-y-auto bg-background">
        <div className="relative z-10 flex justify-center px-6 py-10">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gray-100 w-full" />

            <div className="px-8 pb-6">
              <div className="h-20 w-20 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center -mt-8 mb-4">
                <HopIcon className="h-12 w-12 text-foreground" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Application Name</h1>
            </div>

            <div className="px-8 pb-8 space-y-8">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Inputs</h2>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">User Question</label>
                    <textarea
                      readOnly
                      placeholder="Type something..."
                      className="w-full min-h-[100px] px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg resize-none placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Files</label>
                    <div className="flex flex-col items-center justify-center gap-2 py-8 border border-dashed border-gray-300 rounded-lg bg-white text-center">
                      <FilePlus2 className="h-7 w-7 text-muted-foreground" />
                      <p className="text-[15px] font-semibold text-foreground">
                        Choose or drag and drop here
                      </p>
                      <p className="text-[14px] font-[450] text-muted-foreground">
                        Maximum file size of 20Mb
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Outputs</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Final Answer</label>
                    <div className="flex items-center gap-1">
                      <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="min-h-[48px] border border-gray-200 rounded-lg bg-white" />
                </div>
              </div>
            </div>

            <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-md transition-colors">
                <RotateCcw className="h-3.5 w-3.5" />
                Result History
              </button>
              <button className="px-5 py-2 text-sm font-semibold bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Per-interface preview placeholders ──────────────────────────────────────

function EmptyPreview({ option }: { option: InterfaceOption | null }) {
  if (!option) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
        <p className="relative z-10 text-[16px] text-foreground font-medium">
          You haven&apos;t chosen an interface yet.
        </p>
      </div>
    );
  }

  const Icon = option.icon;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="h-14 w-14 rounded-2xl bg-muted border flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-foreground">{option.label}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Preview for this interface type is coming soon.
        </p>
      </div>
    </div>
  );
}

// ─── Form config view (after "Use this interface") ────────────────────────────

function FormConfigView() {
  const [generalOpen, setGeneralOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(true);
  const [subdomainOpen, setSubdomainOpen] = useState(true);
  const [showInGrid, setShowInGrid] = useState(false);
  const [formEnabled, setFormEnabled] = useState(true);
  const [ssoEnabled, setSsoEnabled] = useState(false);

  const [fields, setFields] = useState<FormField[]>(() => {
    if (typeof window === "undefined") return DEFAULT_FIELDS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FIELDS);
      return saved ? (JSON.parse(saved) as FormField[]) : DEFAULT_FIELDS;
    } catch {
      return DEFAULT_FIELDS;
    }
  });

  const [outputs, setOutputs] = useState<OutputField[]>(() => {
    if (typeof window === "undefined") return DEFAULT_OUTPUTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OUTPUTS);
      return saved ? (JSON.parse(saved) as OutputField[]) : DEFAULT_OUTPUTS;
    } catch {
      return DEFAULT_OUTPUTS;
    }
  });

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingOutputId, setEditingOutputId] = useState<string | null>(null);
  const [appName, setAppName] = useState("Application Name");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(fields));
  }, [fields]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OUTPUTS, JSON.stringify(outputs));
  }, [outputs]);

  const editingField = fields.find((f) => f.id === editingFieldId) ?? null;
  const editingOutput = outputs.find((o) => o.id === editingOutputId) ?? null;

  const updateField = (id: string, patch: Partial<FormField>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const deleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const updateOutput = (id: string, patch: Partial<OutputField>) =>
    setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const deleteOutput = (id: string) => {
    setOutputs((prev) => prev.filter((o) => o.id !== id));
    if (editingOutputId === id) setEditingOutputId(null);
  };

  const handleEditField = (id: string) => {
    setEditingOutputId(null);
    setEditingFieldId(id === editingFieldId ? null : id);
  };

  const handleEditOutput = (id: string) => {
    setEditingFieldId(null);
    setEditingOutputId(id === editingOutputId ? null : id);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Upload modals */}
      {showCoverModal && (
        <ImageUploadModal title="Change Cover" onClose={() => setShowCoverModal(false)} />
      )}
      {showLogoModal && (
        <ImageUploadModal title="Upload Logo" onClose={() => setShowLogoModal(false)} />
      )}

      {/* Left — editable form preview */}
      <div className="flex-1 relative overflow-hidden">
        <div className="h-full overflow-y-auto bg-muted/20 px-8 py-6 space-y-3">
          {/* URL bar */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Published Interface</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-muted-foreground truncate">
                https://www.pruneai.com/ai-webpage/6a13fc2c161ec567691b29b5-example
              </div>
              <button className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-muted transition-colors">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Draft Preview</p>

          <EditableFormCard
            fields={fields}
            outputs={outputs}
            appName={appName}
            isEditingName={isEditingName}
            onEditName={() => setIsEditingName(true)}
            onNameChange={setAppName}
            onNameCommit={() => setIsEditingName(false)}
            onShowCoverModal={() => setShowCoverModal(true)}
            onShowLogoModal={() => setShowLogoModal(true)}
            editingFieldId={editingFieldId}
            onEditField={handleEditField}
            onDeleteField={deleteField}
            editingOutputId={editingOutputId}
            onEditOutput={handleEditOutput}
            onDeleteOutput={deleteOutput}
            onReorderFields={setFields}
            onReorderOutputs={setOutputs}
          />
        </div>

        {/* Field edit panel */}
        {editingField && (
          <div className="absolute right-0 top-0 h-full w-[360px] bg-background border-l shadow-2xl z-20">
            <FieldEditPanel
              field={editingField}
              onClose={() => setEditingFieldId(null)}
              onChange={(patch) => updateField(editingField.id, patch)}
            />
          </div>
        )}

        {/* Output edit panel */}
        {editingOutput && (
          <div className="absolute right-0 top-0 h-full w-[360px] bg-background border-l shadow-2xl z-20">
            <OutputEditPanel
              output={editingOutput}
              onClose={() => setEditingOutputId(null)}
              onChange={(patch) => updateOutput(editingOutput.id, patch)}
            />
          </div>
        )}
      </div>

      {/* Right — settings panel */}
      <div className="w-[620px] shrink-0 border-l bg-background flex flex-col overflow-hidden">
        <div className="px-5 h-[53px] border-b shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-foreground" />
            <span className="text-sm font-semibold text-foreground">Form</span>
          </div>
          <Toggle checked={formEnabled} onChange={setFormEnabled} />
        </div>

        <div className="px-5 py-3.5 border-b flex items-center justify-between shrink-0">
          <span className="text-sm text-foreground">Show in Published Agents Grid</span>
          <Toggle checked={showInGrid} onChange={setShowInGrid} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <AccordionSection
            title="General"
            open={generalOpen}
            onToggle={() => setGeneralOpen(!generalOpen)}
          >
            <div className="space-y-1.5">
              <label className="text-[14px] font-[450] text-muted-foreground">Name</label>
              {/* <input
                defaultValue="Application Name"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-white"
              /> */}
              <Input
              defaultValue="Application Name"
              className="bg-gray-100 font-[450]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[14px] font-[450] text-muted-foreground">Meta Description</label>
              {/* <textarea
                placeholder="Add a description here so users understand what your agent does."
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground bg-white"
              /> */}
              <Textarea
               placeholder="Add a description here so users understand what your agent does."
                className="bg-gray-100 font-[450]"
                rows={5}
              />
            </div>
          </AccordionSection>

          <Separator />

          <AccordionSection
            title="Security"
            open={securityOpen}
            onToggle={() => setSecurityOpen(!securityOpen)}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-[14px] font-[450] text-foreground">
                  Enable Password protection
                </label>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative pt-1">
                {/* <input
                  placeholder="No password set"
                  className="w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-white placeholder:text-muted-foreground"
                /> */}
                <Input
                  placeholder="No password set"
                  className="bg-gray-100 font-[450]"
                />
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-[450] text-foreground">
                  Make it private to your organization (SSO)
                </span>
                <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
              <Toggle checked={ssoEnabled} onChange={setSsoEnabled} />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-[14px] font-[450] text-foreground">
                  Allowed source URLs
                </label>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="https://mywebsite.com/"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-gray-100 placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                No allowed source URLs configured. Add URLs above to restrict access to specific
                domains.
              </p>
            </div>
          </AccordionSection>

          <Separator />

          <AccordionSection
            title="Custom Subdomain"
            open={subdomainOpen}
            onToggle={() => setSubdomainOpen(!subdomainOpen)}
          >
            <div className="space-y-1.5">
              <label className="text-[14px] font-[450] text-foreground">Custom subdomain</label>
              <div className="flex items-center gap-2">
                {/* <input
                  defaultValue="acme.pruneai.com"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-white"
                /> */}
                <Input
                defaultValue="acme.pruneai.com"
                className="bg-gray-100 font-[450]"
                />
                <button className="px-3 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors">
                  Save
                </button>
              </div>
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}

// ─── Root export view ─────────────────────────────────────────────────────────

const ALL_INTERFACES = [...USER_INTERFACES, ...API_INTERFACES];

export function ExportView() {
  const [selected, setSelected] = useState<InterfaceId | null>(null);
  const [configured, setConfigured] = useState(false);

  const selectedOption = ALL_INTERFACES.find((o) => o.id === selected) ?? null;

  if (configured && selected === "form") {
    return <FormConfigView />;
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left — interface preview */}
      <div className="flex-1 overflow-hidden relative">
        {/* Concentric circles background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          {[640, 560, 480, 400, 320, 240].map((r) => (
            <div
              key={r}
              className="absolute rounded-full border border-prune-darkGray opacity-55"
              style={{ width: r * 2, height: r * 2 }}
            />
          ))}
        </div>

        {selected === "form" ? <FormPreview /> : <EmptyPreview option={selectedOption} />}
      </div>

      {/* Right — interface selector */}
      <InterfaceSelectorPanel
        selected={selected}
        onSelect={setSelected}
        onUse={() => setConfigured(true)}
      />
    </div>
  );
}
