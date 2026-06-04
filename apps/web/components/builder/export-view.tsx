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
  ChevronsUpDown,
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
  Hash,
  Users,
  ArrowUp,
  Mic,
  SquarePen,
  Minus,
  Play,
  Plus,
  CirclePlus,
  CircleArrowRight,
  CircleArrowLeft,
  Eye,
  EyeOff,
  ExternalLink,
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
import { EmbedCodeModal } from "./embed-code-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterfaceId =
  | "form"
  | "chat-assistant"
  | "website-chatbot"
  | "batch"
  | "api"

type InterfaceIdOrNone = InterfaceId | "none";

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

interface CaInputField {
  id: string;
  nodeId: string;
  alias: string;
  enabled: boolean;
  required: boolean;
}

interface CaOutputField {
  id: string;
  nodeId: string;
  alias: string;
  enabled: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_INTERFACES: InterfaceOption[] = [
  { id: "form", label: "Form", icon: LayoutList },
  { id: "chat-assistant", label: "Chat Assistant", icon: MessageSquare },
  { id: "website-chatbot", label: "Website Chatbot", icon: MessageCircle },
  { id: "batch", label: "Batch", icon: Table2 },
];

const API_INTERFACES: InterfaceOption[] = [{ id: "api", label: "API", icon: Code2 }];

const ALL_DROPDOWN_INTERFACES: (InterfaceOption | { id: "none"; label: string; icon: React.ElementType })[] = [
  ...USER_INTERFACES,
  ...API_INTERFACES,
];

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

const DEFAULT_CA_INPUTS: CaInputField[] = [
  { id: "ca-in-0", nodeId: "in-0", alias: "User Question", enabled: true, required: false },
  { id: "ca-doc-0", nodeId: "doc-0", alias: "Files", enabled: false, required: false },
];

const DEFAULT_CA_OUTPUTS: CaOutputField[] = [
  { id: "ca-out-0", nodeId: "out-0", alias: "Final Answer", enabled: true },
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

/** Label text + info tooltip icon in one line. Pass className to override the default label style. */
function LabelWithInfo({
  children,
  tip,
  className,
}: {
  children: React.ReactNode;
  tip: string;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("text-sm font-semibold text-foreground", className)}>{children}</span>
      <Tip label={tip}>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-default shrink-0" />
      </Tip>
    </div>
  );
}

/** Small square icon-only button with a tooltip. Use variant="danger" for delete actions. */
function IconBtn({
  onClick,
  tooltip,
  variant = "default",
  children,
}: {
  onClick?: () => void;
  tooltip: string;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <Tip label={tooltip}>
      <button
        onClick={onClick}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-md bg-white border border-gray-200 transition-colors text-muted-foreground",
          variant === "danger" ? "hover:bg-red-50 hover:text-red-500" : "hover:bg-muted",
        )}
      >
        {children}
      </button>
    </Tip>
  );
}

/** Pencil + "Edit" text button with a tooltip. */
function EditTextBtn({ onClick, tooltip }: { onClick: () => void; tooltip: string }) {
  return (
    <Tip label={tooltip}>
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-muted transition-colors"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    </Tip>
  );
}

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

// ─── Interface type dropdown ──────────────────────────────────────────────────

function InterfaceDropdown({
  value,
  onChange,
}: {
  value: InterfaceIdOrNone;
  onChange: (id: InterfaceIdOrNone) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentOption = ALL_DROPDOWN_INTERFACES.find((o) => o.id === value);
  const CurrentIcon = currentOption?.icon ?? LayoutList;

  return (
    <div className="relative w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200/70 hover:border hover:border-gray-600 transition-colors"
      >
        <CurrentIcon className="h-4 w-4 text-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground">
          {currentOption?.label ?? "None"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 px-2 top-[calc(100%+6px)] w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            {ALL_DROPDOWN_INTERFACES.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option.id as InterfaceIdOrNone);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-md flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors",
                    value === option.id && "bg-muted/30",
                  )}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left text-foreground">{option.label}</span>
                  {value === option.id && (
                    <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                  )}
                </button>
              );
            })}
            <div className="h-px bg-gray-100 my-1" />
            <button
              onClick={() => {
                onChange("none");
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                value === "none" && "bg-muted/30",
              )}
            >
              <X className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-left text-muted-foreground">None</span>
              {value === "none" && <Check className="h-3.5 w-3.5 text-foreground shrink-0" />}
            </button>
          </div>
        </>
      )}
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

// ─── Field edit panel ─────────────────────────────────────────────────────────

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
          <LabelWithInfo tip="The display name shown above this input field">Label</LabelWithInfo>
          <input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <LabelWithInfo tip="Hint text shown inside the input when it is empty">
            Placeholder
          </LabelWithInfo>
          <input
            value={field.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground bg-white"
          />
        </div>

        <div className="space-y-2">
          <LabelWithInfo tip="Whether users must fill in this field before submitting">
            Required
          </LabelWithInfo>
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
          <LabelWithInfo tip="Add predefined options users can choose from">
            Multiple Choice
          </LabelWithInfo>
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
      <div className="absolute left-0.5 top-3.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{field.label}</span>
        <div className="flex items-center gap-1">
          <EditTextBtn onClick={onEdit} tooltip="Edit field" />
          <IconBtn onClick={onDelete} tooltip="Delete field" variant="danger">
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

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
      <div className="absolute left-0.5 top-3.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground">{output.label}</label>
        <div className="flex items-center gap-1">
          <IconBtn tooltip="Copy">
            <Copy className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn tooltip="Download">
            <Download className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn tooltip="More options">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </IconBtn>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <EditTextBtn onClick={onEdit} tooltip="Edit output" />
          <IconBtn onClick={onDelete} tooltip="Delete output" variant="danger">
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
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
          <LabelWithInfo tip="The display name shown above this output field">Label</LabelWithInfo>
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
    <div className="bg-white rounded-2xl border border-prune-borderGray shadow-sm overflow-hidden">
      {/* Cover */}
      <div className="relative h-36 bg-gray-200 flex items-center justify-center">
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
        "relative flex flex-col items-center justify-center gap-3 py-5 px-3 rounded-xl border bg-white transition-all duration-150 text-center hover:bg-gray-100",
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

      <div className="relative flex-1 overflow-y-auto bg-gray-100">
        <div className="relative z-10 flex justify-center px-6 py-10">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gray-200 w-full" />

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

// ─── Chat preview (selector stage) ───────────────────────────────────────────

function ChatPreview() {
  return (
    <div className="flex flex-col h-full relative z-10 bg-background shadow-md">
      <div className="px-5 h-[53px] border-b bg-background shrink-0 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground">Chat Assistant</span>
        <div className="w-px h-4 bg-border" />
        <span className="text-[14px] font-[450] text-muted-foreground">
          Build a conversational AI chat interface
        </span>
      </div>

      <div className="relative flex-1 overflow-y-auto bg-gray-100">
        <div className="relative z-10 flex justify-center px-6 py-10">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <span className="text-[14px] font-[450] text-muted-foreground">Application Name</span>
              <button className="text-muted-foreground">
                <SquarePen className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center px-8 py-20 gap-5 text-center">
              <HopIcon className="h-14 w-14 text-foreground" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Application Name</h1>
                <p className="text-[14px] font-[450] text-muted-foreground max-w-sm">
                  Add a description here so users understand what your agent does.
                </p>
              </div>
              <div className="w-full max-w-lg mt-2 border border-gray-200 rounded-2xl px-4 pt-4 pb-3">
                <p className="text-[14px] font-[450] text-muted-foreground text-left mb-8">
                  Write a message...
                </p>
                <div className="flex items-center justify-between">
                  <button className="text-muted-foreground">
                    <ImagePlus className="h-[18px] w-[18px]" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="text-muted-foreground">
                      <Mic className="h-[18px] w-[18px]" />
                    </button>
                    <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-500 text-white">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Website chatbot preview (selector stage) ────────────────────────────────

function WebsiteChatbotPreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col h-full relative z-10 bg-background shadow-md">
      <div className="px-5 h-[53px] border-b bg-background shrink-0 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground">Website Chatbot</span>
        <div className="w-px h-4 bg-border" />
        <span className="text-[14px] font-[450] text-muted-foreground">
          Embed an AI chatbot widget on any website
        </span>
      </div>

      {/* Simulated webpage */}
      <div className="relative flex-1 overflow-hidden bg-gray-100">
        {/* Expanded widget */}
        {open && (
          <div className="absolute bottom-24 right-6 w-[320px] rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Blue header */}
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-400">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <HopIcon className="h-[18px] w-[18px] text-white" />
                </div>
                <span className="text-sm font-semibold text-white">Application Name</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="bg-white flex flex-col items-center justify-center px-6 py-8 gap-4 text-center">
              <HopIcon className="h-10 w-10 text-foreground" />
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-foreground">Application Name</h2>
                <p className="text-[14px] font-[450] text-muted-foreground max-w-[220px]">
                  Add a description here so users understand what your agent does.
                </p>
              </div>
            </div>

            {/* Chat input */}
            <div className="bg-white px-4 pb-4">
              <div className="border border-gray-200 rounded-xl px-3.5 pt-3 pb-2.5">
                <p className="text-[14px] font-[450] text-muted-foreground mb-5">
                  Write a message...
                </p>
                <div className="flex items-center justify-between">
                  <button className="text-muted-foreground">
                    <ImagePlus className="h-[17px] w-[17px]" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="text-muted-foreground">
                      <Mic className="h-[17px] w-[17px]" />
                    </button>
                    <button className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-500 text-white">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating trigger button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="absolute bottom-6 right-6 h-14 w-14 rounded-2xl bg-emerald-400 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <HopIcon className="h-7 w-7 text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Website Chatbot config preview (left side) ──────────────────────────────

function WebsiteChatbotConfigPreview({ appName }: { appName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="relative h-[420px] bg-gray-100">
        {/* Skeleton page content */}
        <div className="absolute inset-0 p-8 pointer-events-none">
          <div className="space-y-3 opacity-20">
            <div className="h-5 bg-gray-600 rounded-lg w-1/2" />
            <div className="h-3 bg-gray-500 rounded w-full" />
            <div className="h-3 bg-gray-500 rounded w-11/12" />
            <div className="h-3 bg-gray-500 rounded w-4/5" />
            <div className="h-3 bg-gray-500 rounded w-3/4" />
            <div className="mt-5 h-8 bg-gray-500 rounded-lg w-1/4" />
            <div className="mt-6 h-3 bg-gray-400 rounded w-full" />
            <div className="h-3 bg-gray-400 rounded w-10/12" />
            <div className="h-3 bg-gray-400 rounded w-5/6" />
          </div>
        </div>

        {/* Expanded chat widget */}
        {open && (
          <div className="absolute bottom-[76px] right-4 w-[280px] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-10">
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-400">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <HopIcon className="h-[18px] w-[18px] text-white" />
                </div>
                <span className="text-sm font-semibold text-white">{appName}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white flex flex-col items-center justify-center px-5 py-6 gap-3 text-center">
              <HopIcon className="h-10 w-10 text-foreground" />
              <div className="space-y-1">
                <h2 className="text-base font-bold text-foreground">{appName}</h2>
                <p className="text-[13px] text-muted-foreground max-w-[200px]">
                  Add a description here so users understand what your agent does.
                </p>
              </div>
            </div>

            <div className="bg-white px-4 pb-4">
              <div className="border border-gray-200 rounded-xl px-3 pt-2.5 pb-2">
                <p className="text-[13px] text-muted-foreground mb-4">Write a message...</p>
                <div className="flex items-center justify-between">
                  <button className="text-muted-foreground">
                    <ImagePlus className="h-[15px] w-[15px]" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button className="text-muted-foreground">
                      <Mic className="h-[15px] w-[15px]" />
                    </button>
                    <button className="h-6 w-6 flex items-center justify-center rounded-lg bg-gray-400 text-white">
                      <ArrowUp className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating launch button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="absolute bottom-4 right-4 h-14 w-14 rounded-2xl bg-emerald-400 flex items-center justify-center shadow-lg hover:bg-emerald-500 transition-colors z-10"
        >
          {open ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <HopIcon className="h-7 w-7 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Batch preview (selector stage) ──────────────────────────────────────────

function BatchPreview() {
  return (
    <div className="flex flex-col h-full relative z-10 bg-background shadow-md">
      <div className="px-5 h-[53px] border-b bg-background shrink-0 flex items-center gap-2">
        <Table2 className="h-5 w-5 text-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground">Batch</span>
        <div className="w-px h-4 bg-border" />
        <span className="text-[14px] font-[450] text-muted-foreground">
          Run your agent across multiple inputs at once
        </span>
      </div>

      <div className="relative flex-1 overflow-y-auto bg-gray-100">
        <div className="flex justify-center px-6 py-10">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* App header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
              <div className="h-14 w-14 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                <HopIcon className="h-8 w-8 text-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Application Name</h1>
                <p className="text-[14px] font-[450] text-muted-foreground">
                  Add a description here so users understand what your agent does.
                </p>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button className="px-3.5 py-1.5 text-[14px] font-[450] text-muted-foreground rounded-md hover:text-foreground transition-colors">
                  Resizable
                </button>
                <button className="px-3.5 py-1.5 text-[14px] font-[450] text-foreground bg-white rounded-md shadow-sm border border-gray-200">
                  Auto
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-[450] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-foreground">
                  <Plus className="h-3.5 w-3.5" />
                  Add Run
                </button>
                <button className="flex items-center gap-1.5 px-4 py-1.5 text-[14px] font-[450] bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Batch
                </button>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="w-24 px-4 py-3 text-left text-[14px] font-[450] text-muted-foreground font-normal">
                    Actions
                  </th>
                  <th className="px-4 py-3 text-left border-l border-gray-100">
                    <div className="flex items-center gap-1.5 text-[14px] font-[450] text-muted-foreground font-normal">
                      <List className="h-4 w-4 shrink-0" />
                      User Question
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left border-l border-gray-100">
                    <div className="flex items-center gap-1.5 text-[14px] font-[450] text-muted-foreground font-normal">
                      <CirclePlus className="h-4 w-4 shrink-0" />
                      Final Answer
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <button className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 text-muted-foreground transition-colors">
                        <Play className="h-3 w-3" />
                      </button>
                      <button className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-l border-gray-100">
                    <p className="text-[14px] font-[450] text-muted-foreground">User Question</p>
                  </td>
                  <td className="px-4 py-4 border-l border-gray-100" />
                </tr>
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-[14px] font-[450] text-muted-foreground">
                Page <span className="font-semibold text-foreground">1</span> of 1 (1 runs,{" "}
                <span className="font-semibold text-foreground">0</span> running)
              </span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-[14px] font-[450] border border-gray-200 rounded-lg text-muted-foreground hover:bg-gray-50 transition-colors">
                  Previous
                </button>
                <button className="px-3 py-1.5 text-[14px] font-[450] border border-gray-200 rounded-lg text-muted-foreground hover:bg-gray-50 transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── API preview (selector stage) ────────────────────────────────────────────

function ApiPreview() {
  return (
    <div className="flex flex-col h-full relative z-10 bg-background shadow-md">
      <div className="px-5 h-[53px] border-b bg-background shrink-0 flex items-center gap-2">
        <Code2 className="h-5 w-5 text-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground">API</span>
        <div className="w-px h-4 bg-border" />
        <span className="text-[14px] font-[450] text-muted-foreground">
          Connect your workflow to an external API
        </span>
      </div>

      <div className="relative flex-1 bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Code2 className="h-5 w-5 text-foreground" />
          </div>
          <span className="text-[14px] font-[450] text-muted-foreground">
            Connect your workflow to an external API
          </span>
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

// ─── Chat assistant preview ───────────────────────────────────────────────────

function ChatAssistantPreview({ appName }: { appName: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <span className="text-[14px] font-[450] text-muted-foreground">{appName}</span>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <SquarePen className="h-4 w-4" />
        </button>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center justify-center px-8 py-20 gap-5 text-center">
        <HopIcon className="h-14 w-14 text-foreground" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{appName}</h1>
          <p className="text-[14px] font-[450] text-muted-foreground max-w-sm">
            Add a description here so users understand what your agent does.
          </p>
        </div>

        {/* Chat input */}
        <div className="w-full max-w-lg mt-2 border border-gray-200 rounded-2xl px-4 pt-4 pb-3">
          <p className="text-[14px] font-[450] text-muted-foreground text-left mb-8">
            Write a message...
          </p>
          <div className="flex items-center justify-between">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <ImagePlus className="h-[18px] w-[18px]" />
            </button>
            <div className="flex items-center gap-2">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Mic className="h-[18px] w-[18px]" />
              </button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interface coming soon placeholder ────────────────────────────────────────

function InterfaceComingSoon({ id }: { id: InterfaceIdOrNone }) {
  const option = ALL_DROPDOWN_INTERFACES.find((o) => o.id === id);
  const Icon = option?.icon ?? Boxes;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 gap-4 text-center px-8">
      <div className="h-14 w-14 rounded-2xl bg-muted border flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-[14px] font-[450] text-foreground">{option?.label ?? "Interface"}</p>
        <p className="text-[14px] font-[450] text-muted-foreground leading-relaxed">
          Preview for this interface type is coming soon.
        </p>
      </div>
    </div>
  );
}

// ─── API config preview (left panel) ─────────────────────────────────────────

type ApiLang = "python" | "javascript" | "curl";

const PY_KEYWORDS = new Set(["import", "from", "def", "return", "class", "if", "else", "elif", "for", "while", "in", "not", "and", "or", "True", "False", "None", "with", "as", "pass", "async", "await"]);

function tokenizePyLine(line: string): { text: string; color: string }[] {
  const tokens: { text: string; color: string }[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === " " || line[i] === "\t") {
      let sp = ""; while (i < line.length && (line[i] === " " || line[i] === "\t")) sp += line[i++];
      tokens.push({ text: sp, color: "#d4d4d4" }); continue;
    }
    if (line[i] === "#") { tokens.push({ text: line.slice(i), color: "#6a9955" }); break; }
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]; let s = q; i++;
      while (i < line.length && line[i] !== q) { if (line[i] === "\\" && i + 1 < line.length) { s += line[i++]; } s += line[i++]; }
      if (i < line.length) { s += q; i++; }
      tokens.push({ text: s, color: "#ce9178" }); continue;
    }
    if (/[a-zA-Z_]/.test(line[i])) {
      let w = ""; while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) w += line[i++];
      tokens.push({ text: w, color: PY_KEYWORDS.has(w) ? "#569cd6" : "#d4d4d4" }); continue;
    }
    if (/[0-9]/.test(line[i])) {
      let n = ""; while (i < line.length && /[0-9.]/.test(line[i])) n += line[i++];
      tokens.push({ text: n, color: "#b5cea8" }); continue;
    }
    tokens.push({ text: line[i], color: "#808080" }); i++;
  }
  return tokens;
}

const API_JS_KW = new Set(["const", "let", "var", "function", "async", "await", "return", "new", "true", "false", "null"]);

function tokenizeApiJSLine(line: string): { text: string; color: string }[] {
  const tokens: { text: string; color: string }[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === " " || line[i] === "\t") {
      let sp = ""; while (i < line.length && (line[i] === " " || line[i] === "\t")) sp += line[i++];
      tokens.push({ text: sp, color: "#d4d4d4" }); continue;
    }
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]; let s = q; i++;
      while (i < line.length && line[i] !== q) { if (line[i] === "\\" && i + 1 < line.length) { s += line[i++]; } s += line[i++]; }
      if (i < line.length) { s += q; i++; }
      tokens.push({ text: s, color: "#ce9178" }); continue;
    }
    if (/[a-zA-Z_$]/.test(line[i])) {
      let w = ""; while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) w += line[i++];
      tokens.push({ text: w, color: API_JS_KW.has(w) ? "#569cd6" : "#d4d4d4" }); continue;
    }
    tokens.push({ text: line[i], color: "#808080" }); i++;
  }
  return tokens;
}

function tokenizeCurlLine(line: string): { text: string; color: string }[] {
  const tokens: { text: string; color: string }[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === " " || line[i] === "\t") {
      let sp = ""; while (i < line.length && (line[i] === " " || line[i] === "\t")) sp += line[i++];
      tokens.push({ text: sp, color: "#d4d4d4" }); continue;
    }
    if (line[i] === "\\") { tokens.push({ text: "\\", color: "#569cd6" }); i++; continue; }
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]; let s = q; i++;
      while (i < line.length && line[i] !== q) { if (line[i] === "\\" && i + 1 < line.length) { s += line[i++]; } s += line[i++]; }
      if (i < line.length) { s += q; i++; }
      tokens.push({ text: s, color: "#ce9178" }); continue;
    }
    if (line[i] === "-" && i + 1 < line.length && /[a-zA-Z]/.test(line[i + 1])) {
      let flag = "-"; i++;
      while (i < line.length && /[a-zA-Z]/.test(line[i])) flag += line[i++];
      tokens.push({ text: flag, color: "#569cd6" }); continue;
    }
    if (/[a-zA-Z_]/.test(line[i])) {
      let w = ""; while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) w += line[i++];
      if (w === "curl") tokens.push({ text: w, color: "#dcdcaa" });
      else if (["POST", "GET", "PUT", "DELETE", "PATCH"].includes(w)) tokens.push({ text: w, color: "#4ec9b0" });
      else tokens.push({ text: w, color: "#d4d4d4" });
      continue;
    }
    tokens.push({ text: line[i], color: "#808080" }); i++;
  }
  return tokens;
}

function ApiLangDropdown({ value, onChange }: { value: ApiLang; onChange: (v: ApiLang) => void }) {
  const [open, setOpen] = useState(false);
  const options: { id: ApiLang; label: string }[] = [
    { id: "python", label: "Python" },
    { id: "javascript", label: "JavaScript" },
    { id: "curl", label: "cURL" },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-3 pr-2.5 py-2 text-sm bg-white border border-gray-200 rounded-lg font-medium text-foreground hover:bg-gray-50 transition-colors"
      >
        {options.find((o) => o.id === value)?.label}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[150px]">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                {opt.label}
                {value === opt.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const PRUNE_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function ApiConfigPreview({ workflowId }: { workflowId?: string | null }) {
  const [lang, setLang] = useState<ApiLang>("python");
  const [showToken, setShowToken] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [outCopied, setOutCopied] = useState(false);

  const API_ENDPOINT = `${PRUNE_API_URL}/v1/chat`;
  const wfId = workflowId ?? "<your-workflow-id>";
  const token = showToken ? "sk-live-a1b2-c3d4-e5f6-7890abcdef12" : "XXXXXXXXXXXX";

  const pythonLines = [
    `import requests`,
    ``,
    `API_URL = "${API_ENDPOINT}"`,
    ``,
    `def query(message):`,
    `  response = requests.post(API_URL, json={`,
    `    "workflow_id": "${wfId}",`,
    `    "message": message`,
    `  })`,
    `  return response.json()`,
    ``,
    `result = query("Hello, what can you do?")`,
    `print(result["reply"])`,
  ];

  const jsLines = [
    `const API_URL = "${API_ENDPOINT}";`,
    ``,
    `async function query(message) {`,
    `  const res = await fetch(API_URL, {`,
    `    method: "POST",`,
    `    headers: { "Content-Type": "application/json" },`,
    `    body: JSON.stringify({`,
    `      workflow_id: "${wfId}",`,
    `      message`,
    `    })`,
    `  });`,
    `  return res.json();`,
    `}`,
    ``,
    `query("Hello, what can you do?").then(r => console.log(r.reply));`,
  ];

  const curlLines = [
    `curl -X POST \\`,
    `  "${API_ENDPOINT}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{`,
    `    "workflow_id": "${wfId}",`,
    `    "message": "Hello, what can you do?"`,
    `  }'`,
  ];

  const lines = lang === "python" ? pythonLines : lang === "javascript" ? jsLines : curlLines;
  const tokenizeLine = lang === "python" ? tokenizePyLine : lang === "javascript" ? tokenizeApiJSLine : tokenizeCurlLine;

  const handleCopy = () => {
    navigator.clipboard.writeText(lines.join("\n"));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleRun = async () => {
    if (!workflowId) {
      setError("Save the workflow first (it needs a workflow ID).");
      return;
    }
    setRunning(true);
    setOutput(null);
    setError(null);
    try {
      const res = await fetch(`${PRUNE_API_URL}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_id: workflowId, message: "Hello, what can you do?" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`);
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setRunning(false);
    }
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setOutCopied(true);
    setTimeout(() => setOutCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
        <div className="h-16 w-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
          <Code2 className="h-8 w-8 text-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">API</h2>
          <p className="text-sm text-muted-foreground">Use your application via API</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-6 py-4">
        <ApiLangDropdown value={lang} onChange={setLang} />
        <div className="flex-1" />
        <button
          onClick={() => setShowToken(!showToken)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showToken ? "Hide Token" : "Show Token"}
        </button>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-60"
        >
          <Play className="h-3.5 w-3.5" fill="currentColor" />
          {running ? "Running…" : "Run"}
        </button>
      </div>

      {/* Code editor */}
      <div className="relative border-t border-[#2a2a2a] bg-[#1e1e1e]">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {codeCopied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className={codeCopied ? "text-emerald-400" : ""}>{codeCopied ? "Copied" : "Copy"}</span>
        </button>
        <div className="overflow-x-auto py-3">
          <table className="text-[13px] font-mono border-separate border-spacing-0 w-full">
            <tbody>
              {lines.map((line, i) => (
                <tr key={`${lang}-${i}`} className="group">
                  <td className="select-none w-12 pl-4 pr-4 text-right align-top leading-6 text-[#4a4a4a] group-hover:text-[#6a6a6a] border-r border-[#2a2a2a]">
                    {i + 1}
                  </td>
                  <td className="pl-5 pr-16 whitespace-pre leading-6 group-hover:bg-white/[0.03]">
                    {tokenizeLine(line).map((tok, j) => (
                      <span key={j} style={{ color: tok.color }}>{tok.text || " "}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terminal output */}
      <div className="bg-[#1a1a1a]">
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[#111]">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1" />
          {output && (
            <button onClick={handleCopyOutput} className="text-gray-400 hover:text-gray-200 transition-colors">
              {outCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        <div className="px-4 pb-4 min-h-[56px] font-mono text-[13px]">
          {running ? (
            <span className="text-gray-500">Running…</span>
          ) : output ? (
            <pre className="text-[#ce9178] whitespace-pre-wrap">{output}</pre>
          ) : error ? (
            <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
          ) : (
            <span className="text-gray-500">
              {workflowId ? "Click Run to test your API" : "Save the workflow first to enable live testing"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── API settings (right panel) ───────────────────────────────────────────────

function ApiSettings() {
  const [generalOpen, setGeneralOpen] = useState(true);
  const [authOpen, setAuthOpen] = useState(true);
  const [rateLimitOpen, setRateLimitOpen] = useState(false);
  const [corsOpen, setCorsOpen] = useState(false);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [requestsPerMin, setRequestsPerMin] = useState(60);
  const [allowedOrigins, setAllowedOrigins] = useState("");
  const sl = "text-[14px] font-[450]";
  const apiToken = "sk-live-a1b2-c3d4-e5f6-7890abcdef12";

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* General */}
      <AccordionSection title="General" open={generalOpen} onToggle={() => setGeneralOpen(!generalOpen)}>
        <div className="space-y-1.5">
          <LabelWithInfo tip="The name of your API endpoint" className={cn(sl, "text-muted-foreground")}>
            Name
          </LabelWithInfo>
          <Input defaultValue="Application Name" className="bg-gray-100 font-[450]" />
        </div>
        <div className="space-y-1.5">
          <LabelWithInfo tip="Brief description of what this API does" className={cn(sl, "text-muted-foreground")}>
            Description
          </LabelWithInfo>
          <Textarea placeholder="Describe your API endpoint…" className="bg-gray-100 font-[450]" rows={3} />
        </div>
      </AccordionSection>

      <Separator />

      {/* Authentication */}
      <AccordionSection title="Authentication" open={authOpen} onToggle={() => setAuthOpen(!authOpen)}>
        <div className="space-y-2">
          <LabelWithInfo tip="Your secret API token — keep this private and never share it publicly" className={sl}>
            API Token
          </LabelWithInfo>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={tokenVisible ? apiToken : apiToken.replace(/[a-zA-Z0-9]/g, "•")}
                readOnly
                className="bg-gray-100 font-mono text-sm pr-10"
              />
              <button
                onClick={() => setTokenVisible(!tokenVisible)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {tokenVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button
              onClick={handleCopyToken}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-muted transition-colors shrink-0"
            >
              {tokenCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {tokenCopied ? "Copied" : "Copy"}
            </button>
          </div>
          <button className="text-sm text-red-500 hover:text-red-600 hover:underline transition-colors">
            Regenerate token
          </button>
        </div>
      </AccordionSection>

      <Separator />

      {/* Rate Limits */}
      <AccordionSection title="Rate Limits" open={rateLimitOpen} onToggle={() => setRateLimitOpen(!rateLimitOpen)}>
        <div className="space-y-1.5">
          <LabelWithInfo tip="Maximum number of API requests allowed per minute per token" className={cn(sl, "text-muted-foreground")}>
            Requests per minute
          </LabelWithInfo>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={requestsPerMin}
              onChange={(e) => setRequestsPerMin(Number(e.target.value))}
              className="bg-gray-100 font-[450] w-28"
              min={1}
              max={1000}
            />
            <span className="text-sm text-muted-foreground">req / min</span>
          </div>
        </div>
      </AccordionSection>

      <Separator />

      {/* Allowed Origins */}
      <AccordionSection title="Allowed Origins" open={corsOpen} onToggle={() => setCorsOpen(!corsOpen)}>
        <div className="space-y-1.5">
          <LabelWithInfo tip="Restrict API access to requests originating from specific domains (CORS)" className={cn(sl, "text-muted-foreground")}>
            Allowed domains
          </LabelWithInfo>
          <Input
            value={allowedOrigins}
            onChange={(e) => setAllowedOrigins(e.target.value)}
            placeholder="https://mywebsite.com/"
            className="bg-gray-100 font-[450] placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Leave empty to allow requests from any origin.
          </p>
        </div>
      </AccordionSection>
    </div>
  );
}

// ─── Chat Assistant — draggable field rows ────────────────────────────────────

function CaInputRow({
  field,
  isDragging,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onChange,
}: {
  field: CaInputField;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onChange: (patch: Partial<CaInputField>) => void;
}) {
  return (
    <tr
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={cn("group border-b border-gray-100 last:border-0", isDragging && "opacity-40")}
    >
      <td className="w-8 px-2 py-2.5">
        <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab" />
      </td>
      <td className="w-8 px-1 py-2.5">
        <button
          onClick={() => onChange({ enabled: !field.enabled })}
          className={cn(
            "h-4 w-4 rounded flex items-center justify-center border transition-colors",
            field.enabled ? "bg-foreground border-foreground" : "border-gray-300",
          )}
        >
          {field.enabled && <Check className="h-2.5 w-2.5 text-background" />}
        </button>
      </td>
      <td className="px-2 py-2.5 whitespace-nowrap">
        <span className="text-xs font-mono bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md text-foreground">
          {field.nodeId}
        </span>
      </td>
      <td className="px-2 py-2.5 w-full">
        <Input
          value={field.alias}
          onChange={(e) => onChange({ alias: e.target.value })}
          className="h-7 text-xs bg-gray-100 border-gray-200 font-[450]"
        />
      </td>
      <td className="w-14 px-2 py-2.5 text-center">
        <button
          onClick={() => onChange({ required: !field.required })}
          className={cn(
            "h-4 w-4 rounded flex items-center justify-center border transition-colors mx-auto",
            field.required ? "bg-foreground border-foreground" : "border-gray-300",
          )}
        >
          {field.required && <Check className="h-2.5 w-2.5 text-background" />}
        </button>
      </td>
    </tr>
  );
}

function CaOutputRow({
  field,
  isDragging,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onChange,
}: {
  field: CaOutputField;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onChange: (patch: Partial<CaOutputField>) => void;
}) {
  return (
    <tr
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={cn("group border-b border-gray-100 last:border-0", isDragging && "opacity-40")}
    >
      <td className="w-8 px-2 py-2.5">
        <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab" />
      </td>
      <td className="w-8 px-1 py-2.5">
        <button
          onClick={() => onChange({ enabled: !field.enabled })}
          className={cn(
            "h-4 w-4 rounded flex items-center justify-center border transition-colors",
            field.enabled ? "bg-foreground border-foreground" : "border-gray-300",
          )}
        >
          {field.enabled && <Check className="h-2.5 w-2.5 text-background" />}
        </button>
      </td>
      <td className="px-2 py-2.5 whitespace-nowrap">
        <span className="text-xs font-mono bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md text-foreground">
          {field.nodeId}
        </span>
      </td>
      <td className="px-2 py-2.5 w-full" colSpan={2}>
        <Input
          value={field.alias}
          onChange={(e) => onChange({ alias: e.target.value })}
          className="h-7 text-xs bg-gray-100 border-gray-200 font-[450]"
        />
      </td>
    </tr>
  );
}

// ─── Chat Assistant settings panel ────────────────────────────────────────────

function ChatAssistantSettings({ workflowId }: { workflowId?: string | null }) {
  const [generalOpen, setGeneralOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [styleOpen, setStyleOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [subdomainOpen, setSubdomainOpen] = useState(true);

  // Fields
  const [caInputs, setCaInputs] = useState<CaInputField[]>(DEFAULT_CA_INPUTS);
  const [caOutputs, setCaOutputs] = useState<CaOutputField[]>(DEFAULT_CA_OUTPUTS);

  const inputDragItem = useRef<number | null>(null);
  const inputDragOver = useRef<number | null>(null);
  const outputDragItem = useRef<number | null>(null);
  const outputDragOver = useRef<number | null>(null);
  const [inputDraggingIdx, setInputDraggingIdx] = useState<number | null>(null);
  const [outputDraggingIdx, setOutputDraggingIdx] = useState<number | null>(null);

  const handleInputDragStart = (i: number) => { inputDragItem.current = i; setInputDraggingIdx(i); };
  const handleInputDragEnter = (i: number) => { inputDragOver.current = i; };
  const handleInputDragEnd = () => {
    if (inputDragItem.current !== null && inputDragOver.current !== null && inputDragItem.current !== inputDragOver.current) {
      const arr = [...caInputs];
      const [item] = arr.splice(inputDragItem.current, 1);
      arr.splice(inputDragOver.current, 0, item);
      setCaInputs(arr);
    }
    inputDragItem.current = null; inputDragOver.current = null; setInputDraggingIdx(null);
  };

  const handleOutputDragStart = (i: number) => { outputDragItem.current = i; setOutputDraggingIdx(i); };
  const handleOutputDragEnter = (i: number) => { outputDragOver.current = i; };
  const handleOutputDragEnd = () => {
    if (outputDragItem.current !== null && outputDragOver.current !== null && outputDragItem.current !== outputDragOver.current) {
      const arr = [...caOutputs];
      const [item] = arr.splice(outputDragItem.current, 1);
      arr.splice(outputDragOver.current, 0, item);
      setCaOutputs(arr);
    }
    outputDragItem.current = null; outputDragOver.current = null; setOutputDraggingIdx(null);
  };

  // Configuration
  const [userFeedback, setUserFeedback] = useState(false);
  const [relatedResults, setRelatedResults] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [showAttachmentIcon, setShowAttachmentIcon] = useState(true);
  const [showAudioIcon, setShowAudioIcon] = useState(true);
  const [collapseSidebar, setCollapseSidebar] = useState(false);
  const [llmTitleGen, setLlmTitleGen] = useState(true);
  const [hideWelcomeAvatar, setHideWelcomeAvatar] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Understanding Request...");
  const [conversationStarters, setConversationStarters] = useState(false);

  // Security
  const [ssoEnabled, setSsoEnabled] = useState(false);

  // Style
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const sl = "text-[14px] font-[450]";

  const configToggles = [
    { label: "User feedback", tip: "Show a thumbs up/down button after each response", value: userFeedback, set: setUserFeedback },
    { label: "Related results", tip: "Show related suggestions after each assistant response", value: relatedResults, set: setRelatedResults },
    { label: "Show steps", tip: "Display the reasoning steps the assistant takes", value: showSteps, set: setShowSteps },
    { label: "Show actions", tip: "Show action buttons the assistant can take", value: showActions, set: setShowActions },
    { label: "Show attachment icon", tip: "Allow users to attach files to their messages", value: showAttachmentIcon, set: setShowAttachmentIcon },
    { label: "Show audio icon", tip: "Allow users to record audio messages", value: showAudioIcon, set: setShowAudioIcon },
    { label: "Collapse sidebar by default", tip: "Start with the conversation sidebar collapsed", value: collapseSidebar, set: setCollapseSidebar },
    { label: "Enable LLM title generation", tip: "Automatically generate conversation titles using AI", value: llmTitleGen, set: setLlmTitleGen },
    { label: "Hide welcome avatar", tip: "Hide the avatar icon on the welcome screen", value: hideWelcomeAvatar, set: setHideWelcomeAvatar },
  ];

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const chatUrl = workflowId ? `${APP_URL}/chat/${workflowId}` : null;
  const [linkCopied, setLinkCopied] = useState(false);

  return (
    <>
      {showAvatarModal && <ImageUploadModal title="Upload Avatar" onClose={() => setShowAvatarModal(false)} />}

      <div className="flex-1 overflow-y-auto">
        {/* Share link — most important for client delivery */}
        <div className="px-5 py-4 border-b bg-emerald-50/50">
          <p className="text-[13px] font-semibold text-foreground mb-2">Share Link</p>
          {chatUrl ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={chatUrl}
                className="flex-1 text-[12px] font-mono px-2 py-1.5 rounded-md border bg-white text-foreground truncate"
              />
              <button
                onClick={() => { navigator.clipboard.writeText(chatUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] border rounded-md hover:bg-muted transition-colors shrink-0"
              >
                {linkCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {linkCopied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => window.open(chatUrl, "_blank")}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] border rounded-md hover:bg-muted transition-colors shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">Save your workflow to get a shareable link.</p>
          )}
        </div>

        {/* General */}
        <AccordionSection title="General" open={generalOpen} onToggle={() => setGeneralOpen(!generalOpen)}>
          <div className="space-y-1.5">
            <LabelWithInfo tip="The name of your chat assistant" className={cn(sl, "text-muted-foreground")}>
              Name
            </LabelWithInfo>
            <Input defaultValue="Application Name" className="bg-gray-100 font-[450]" />
          </div>
          <div className="space-y-1.5">
            <LabelWithInfo tip="Brief description shown to users" className={cn(sl, "text-muted-foreground")}>
              Meta Description
            </LabelWithInfo>
            <Textarea
              placeholder="Add a description here so users understand what your agent does."
              className="bg-gray-100 font-[450]"
              rows={4}
            />
          </div>
        </AccordionSection>

        <Separator />

        {/* Fields */}
        <AccordionSection title="Fields" open={fieldsOpen} onToggle={() => setFieldsOpen(!fieldsOpen)}>
          {/* Inputs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CircleArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              <LabelWithInfo tip="Map workflow input nodes to fields shown in this interface" className="text-sm font-semibold text-foreground">
                Inputs
              </LabelWithInfo>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="w-8 px-2 py-2" />
                    <th className="w-8 px-1 py-2" />
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Node ID</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Alias (optional)</th>
                    <th className="w-14 px-2 py-2 text-center text-xs font-medium text-muted-foreground">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {caInputs.map((field, index) => (
                    <CaInputRow
                      key={field.id}
                      field={field}
                      isDragging={inputDraggingIdx === index}
                      onDragStart={() => handleInputDragStart(index)}
                      onDragEnter={() => handleInputDragEnter(index)}
                      onDragEnd={handleInputDragEnd}
                      onChange={(patch) => setCaInputs((prev) => prev.map((f) => (f.id === field.id ? { ...f, ...patch } : f)))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outputs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CircleArrowLeft className="h-5 w-5 text-muted-foreground shrink-0" />
              <LabelWithInfo tip="Map workflow output nodes to results shown in this interface" className="text-sm font-semibold text-foreground">
                Outputs
              </LabelWithInfo>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="w-8 px-2 py-2" />
                    <th className="w-8 px-1 py-2" />
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Node ID</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground" colSpan={2}>Alias (optional)</th>
                  </tr>
                </thead>
                <tbody>
                  {caOutputs.map((field, index) => (
                    <CaOutputRow
                      key={field.id}
                      field={field}
                      isDragging={outputDraggingIdx === index}
                      onDragStart={() => handleOutputDragStart(index)}
                      onDragEnter={() => handleOutputDragEnter(index)}
                      onDragEnd={handleOutputDragEnd}
                      onChange={(patch) => setCaOutputs((prev) => prev.map((f) => (f.id === field.id ? { ...f, ...patch } : f)))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AccordionSection>

        <Separator />

        {/* Style */}
        <AccordionSection title="Style" open={styleOpen} onToggle={() => setStyleOpen(!styleOpen)}>
          <div className="space-y-3">
            <span className={cn(sl, "text-muted-foreground")}>Avatar</span>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
                <HopIcon className="h-9 w-9 text-foreground" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Change
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Suggested size is 64 × 64</p>
              </div>
            </div>
          </div>
        </AccordionSection>

        <Separator />

        {/* Configuration */}
        <AccordionSection title="Configuration" open={configOpen} onToggle={() => setConfigOpen(!configOpen)}>
          <div className="divide-y divide-gray-100 -mt-4">
            {configToggles.map(({ label, tip, value, set }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <LabelWithInfo tip={tip} className={sl}>{label}</LabelWithInfo>
                <Toggle checked={value} onChange={set} />
              </div>
            ))}
            <div className="py-3 space-y-2">
              <LabelWithInfo
                tip="Shown while the assistant is generating a response"
                className={sl}
              >
                Default loading message
              </LabelWithInfo>
              <Input
                value={loadingMessage}
                onChange={(e) => setLoadingMessage(e.target.value)}
                className="bg-gray-100 font-[450]"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <LabelWithInfo tip="Show pre-defined starter prompts on the welcome screen" className={sl}>
                Conversation Starters
              </LabelWithInfo>
              <Toggle checked={conversationStarters} onChange={setConversationStarters} />
            </div>
          </div>
        </AccordionSection>

        <Separator />

        {/* Security */}
        <AccordionSection title="Security" open={securityOpen} onToggle={() => setSecurityOpen(!securityOpen)}>
          <div className="space-y-1.5">
            <LabelWithInfo tip="Require a password before users can access this chat" className={sl}>
              Enable Password protection
            </LabelWithInfo>
            <div className="relative">
              <Input placeholder="No password set" className="bg-gray-100 font-[450]" />
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <LabelWithInfo tip="Restrict access to members of your organization via SSO" className={sl}>
              Make it private to your organization (SSO)
            </LabelWithInfo>
            <Toggle checked={ssoEnabled} onChange={setSsoEnabled} />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <LabelWithInfo tip="Only allow this chat to be embedded on specific domains" className={sl}>
              Allowed source URLs
            </LabelWithInfo>
            <Input
              placeholder="https://mywebsite.com/"
              className="bg-gray-100 font-[450] placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              No allowed source URLs configured. Add URLs above to restrict access to specific domains.
            </p>
          </div>
        </AccordionSection>

        <Separator />

        {/* Custom Subdomain */}
        <AccordionSection title="Custom Subdomain" open={subdomainOpen} onToggle={() => setSubdomainOpen(!subdomainOpen)}>
          <div className="space-y-1.5">
            <LabelWithInfo tip="Set a custom subdomain URL for your published chat" className={sl}>
              Custom subdomain
            </LabelWithInfo>
            <div className="flex items-center gap-2">
              <Input defaultValue="acme.stack-ai.com" className="bg-gray-100 font-[450]" />
              <button className="px-3 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors shrink-0">
                Save
              </button>
            </div>
          </div>
        </AccordionSection>
      </div>
    </>
  );
}

// ─── Website Chatbot settings panel ──────────────────────────────────────────

const WCB_COLOR_PRESETS = [
  "#34d399", // emerald-400
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#f97316", // orange-500
  "#ec4899", // pink-500
  "#111827", // gray-900
];

function WebsiteChatbotSettings({ workflowId }: { workflowId?: string | null }) {
  const [generalOpen, setGeneralOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [styleOpen, setStyleOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [subdomainOpen, setSubdomainOpen] = useState(true);
  const [embedOpen, setEmbedOpen] = useState(true);

  // Fields
  const [caInputs, setCaInputs] = useState<CaInputField[]>(DEFAULT_CA_INPUTS);
  const [caOutputs, setCaOutputs] = useState<CaOutputField[]>(DEFAULT_CA_OUTPUTS);
  const inputDragItem = useRef<number | null>(null);
  const inputDragOver = useRef<number | null>(null);
  const outputDragItem = useRef<number | null>(null);
  const outputDragOver = useRef<number | null>(null);
  const [inputDraggingIdx, setInputDraggingIdx] = useState<number | null>(null);
  const [outputDraggingIdx, setOutputDraggingIdx] = useState<number | null>(null);

  const handleInputDragStart = (i: number) => { inputDragItem.current = i; setInputDraggingIdx(i); };
  const handleInputDragEnter = (i: number) => { inputDragOver.current = i; };
  const handleInputDragEnd = () => {
    if (inputDragItem.current !== null && inputDragOver.current !== null && inputDragItem.current !== inputDragOver.current) {
      const arr = [...caInputs];
      const [item] = arr.splice(inputDragItem.current, 1);
      arr.splice(inputDragOver.current, 0, item);
      setCaInputs(arr);
    }
    inputDragItem.current = null; inputDragOver.current = null; setInputDraggingIdx(null);
  };
  const handleOutputDragStart = (i: number) => { outputDragItem.current = i; setOutputDraggingIdx(i); };
  const handleOutputDragEnter = (i: number) => { outputDragOver.current = i; };
  const handleOutputDragEnd = () => {
    if (outputDragItem.current !== null && outputDragOver.current !== null && outputDragItem.current !== outputDragOver.current) {
      const arr = [...caOutputs];
      const [item] = arr.splice(outputDragItem.current, 1);
      arr.splice(outputDragOver.current, 0, item);
      setCaOutputs(arr);
    }
    outputDragItem.current = null; outputDragOver.current = null; setOutputDraggingIdx(null);
  };

  // Style
  const [widgetColor, setWidgetColor] = useState(WCB_COLOR_PRESETS[0]);
  const [position, setPosition] = useState<"right" | "left">("right");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [openChatCta, setOpenChatCta] = useState(false);
  const [customToggleSize, setCustomToggleSize] = useState(false);
  const [toggleSize, setToggleSize] = useState(56);

  // Configuration
  const [userFeedback, setUserFeedback] = useState(false);
  const [showAttachmentIcon, setShowAttachmentIcon] = useState(true);
  const [showAudioIcon, setShowAudioIcon] = useState(true);
  const [autoOpen, setAutoOpen] = useState(false);
  const [showLauncherLabel, setShowLauncherLabel] = useState(false);
  const [hideWelcomeAvatar, setHideWelcomeAvatar] = useState(false);
  const [llmTitleGen, setLlmTitleGen] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Understanding Request...");
  const [conversationStarters, setConversationStarters] = useState(false);

  // Security
  const [ssoEnabled, setSsoEnabled] = useState(false);

  // Embed
  const APP_URL_WCB = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const chatSrc = workflowId ? `${APP_URL_WCB}/chat/${workflowId}` : `${APP_URL_WCB}/chat/YOUR_WORKFLOW_ID`;
  const embedSnippet = `<script>\n(function(){\n  var open=false;\n  var iframe=document.createElement('iframe');\n  iframe.src='${chatSrc}';\n  iframe.style.cssText='display:none;position:fixed;bottom:90px;right:20px;width:380px;height:600px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:9999';\n  document.body.appendChild(iframe);\n  var btn=document.createElement('button');\n  btn.style.cssText='position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:#7c3aed;border:none;cursor:pointer;z-index:9999';\n  btn.textContent='💬';\n  btn.onclick=function(){open=!open;iframe.style.display=open?'block':'none';};\n  document.body.appendChild(btn);\n})();\n</script>`;
  const [codeCopied, setCodeCopied] = useState(false);
  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const sl = "text-[14px] font-[450]";

  const configToggles = [
    { label: "User feedback", tip: "Show thumbs up/down after each assistant response", value: userFeedback, set: setUserFeedback },
    { label: "Show attachment icon", tip: "Allow users to attach files to their messages", value: showAttachmentIcon, set: setShowAttachmentIcon },
    { label: "Show audio icon", tip: "Allow users to record audio messages", value: showAudioIcon, set: setShowAudioIcon },
    { label: "Auto-open on page load", tip: "Automatically expand the widget when the page loads", value: autoOpen, set: setAutoOpen },
    { label: "Show launcher label", tip: "Display a text label next to the launch button", value: showLauncherLabel, set: setShowLauncherLabel },
    { label: "Hide welcome avatar", tip: "Hide the avatar icon on the welcome screen", value: hideWelcomeAvatar, set: setHideWelcomeAvatar },
    { label: "Enable LLM title generation", tip: "Automatically generate conversation titles using AI", value: llmTitleGen, set: setLlmTitleGen },
  ];

  return (
    <>
      {showAvatarModal && (
        <ImageUploadModal title="Upload Avatar" onClose={() => setShowAvatarModal(false)} />
      )}

      <div className="flex-1 overflow-y-auto">
        {/* General */}
        <AccordionSection title="General" open={generalOpen} onToggle={() => setGeneralOpen(!generalOpen)}>
          <div className="space-y-1.5">
            <LabelWithInfo tip="The name of your chatbot widget" className={cn(sl, "text-muted-foreground")}>
              Name
            </LabelWithInfo>
            <Input defaultValue="Application Name" className="bg-gray-100 font-[450]" />
          </div>
          <div className="space-y-1.5">
            <LabelWithInfo tip="Brief description shown on the chatbot welcome screen" className={cn(sl, "text-muted-foreground")}>
              Meta Description
            </LabelWithInfo>
            <Textarea
              placeholder="Add a description here so users understand what your agent does."
              className="bg-gray-100 font-[450]"
              rows={4}
            />
          </div>
        </AccordionSection>

        <Separator />

        {/* Fields */}
        <AccordionSection title="Fields" open={fieldsOpen} onToggle={() => setFieldsOpen(!fieldsOpen)}>
          {/* Inputs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CircleArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              <LabelWithInfo tip="Map workflow input nodes to fields shown in this interface" className="text-sm font-semibold text-foreground">
                Inputs
              </LabelWithInfo>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="w-8 px-2 py-2" />
                    <th className="w-8 px-1 py-2" />
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Node ID</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Alias (optional)</th>
                    <th className="w-14 px-2 py-2 text-center text-xs font-medium text-muted-foreground">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {caInputs.map((field, index) => (
                    <CaInputRow
                      key={field.id}
                      field={field}
                      isDragging={inputDraggingIdx === index}
                      onDragStart={() => handleInputDragStart(index)}
                      onDragEnter={() => handleInputDragEnter(index)}
                      onDragEnd={handleInputDragEnd}
                      onChange={(patch) => setCaInputs((prev) => prev.map((f) => (f.id === field.id ? { ...f, ...patch } : f)))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outputs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CircleArrowLeft className="h-5 w-5 text-muted-foreground shrink-0" />
              <LabelWithInfo tip="Map workflow output nodes to results shown in this interface" className="text-sm font-semibold text-foreground">
                Outputs
              </LabelWithInfo>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="w-8 px-2 py-2" />
                    <th className="w-8 px-1 py-2" />
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Node ID</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground" colSpan={2}>Alias (optional)</th>
                  </tr>
                </thead>
                <tbody>
                  {caOutputs.map((field, index) => (
                    <CaOutputRow
                      key={field.id}
                      field={field}
                      isDragging={outputDraggingIdx === index}
                      onDragStart={() => handleOutputDragStart(index)}
                      onDragEnter={() => handleOutputDragEnter(index)}
                      onDragEnd={handleOutputDragEnd}
                      onChange={(patch) => setCaOutputs((prev) => prev.map((f) => (f.id === field.id ? { ...f, ...patch } : f)))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AccordionSection>

        <Separator />

        {/* Style */}
        <AccordionSection title="Style" open={styleOpen} onToggle={() => setStyleOpen(!styleOpen)}>
          {/* Avatar */}
          <div className="space-y-3">
            <span className={cn(sl, "text-muted-foreground")}>Avatar</span>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
                <HopIcon className="h-9 w-9 text-foreground" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Change
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Suggested size is 64 × 64</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Widget color */}
          <div className="space-y-3">
            <LabelWithInfo tip="The primary color used for the chat button and widget header" className={cn(sl, "text-muted-foreground")}>
              Widget color
            </LabelWithInfo>
            <div className="flex items-center gap-2.5">
              {WCB_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => setWidgetColor(color)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all border-2",
                    widgetColor === color ? "border-gray-800 scale-110" : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <label className="h-7 w-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden relative shrink-0">
                <input
                  type="color"
                  value={widgetColor}
                  onChange={(e) => setWidgetColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Plus className="h-3 w-3 text-muted-foreground" />
              </label>
            </div>
          </div>

          <Separator />

          {/* Position */}
          <div className="space-y-2">
            <LabelWithInfo tip="Where the chat button appears on the page" className={cn(sl, "text-muted-foreground")}>
              Position
            </LabelWithInfo>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPosition("left")}
                className={cn(
                  "flex-1 py-2 text-sm rounded-lg border transition-colors",
                  position === "left"
                    ? "bg-white border-gray-400 font-medium text-foreground"
                    : "bg-gray-100 border-gray-200 text-muted-foreground",
                )}
              >
                Bottom left
              </button>
              <button
                onClick={() => setPosition("right")}
                className={cn(
                  "flex-1 py-2 text-sm rounded-lg border transition-colors",
                  position === "right"
                    ? "bg-white border-gray-400 font-medium text-foreground"
                    : "bg-gray-100 border-gray-200 text-muted-foreground",
                )}
              >
                Bottom right
              </button>
            </div>
          </div>

          <Separator />

          {/* Open Chat CTA */}
          <div className="flex items-center justify-between">
            <LabelWithInfo tip="Show a call-to-action label next to the chat button to encourage users to open it" className={cn(sl, "text-muted-foreground")}>
              Open Chat CTA
            </LabelWithInfo>
            <Toggle checked={openChatCta} onChange={setOpenChatCta} />
          </div>

          <Separator />

          {/* Custom Toggle Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <LabelWithInfo tip="Override the default size of the chat button launcher" className={cn(sl, "text-muted-foreground")}>
                Custom Toggle Size
              </LabelWithInfo>
              <Toggle checked={customToggleSize} onChange={setCustomToggleSize} />
            </div>
            {customToggleSize && (
              <input
                type="range"
                min={32}
                max={80}
                value={toggleSize}
                onChange={(e) => setToggleSize(Number(e.target.value))}
                className="w-full accent-foreground cursor-pointer"
              />
            )}
          </div>
        </AccordionSection>

        <Separator />

        {/* Configuration */}
        <AccordionSection title="Configuration" open={configOpen} onToggle={() => setConfigOpen(!configOpen)}>
          <div className="divide-y divide-gray-100 mt-2">
            {configToggles.map(({ label, tip, value, set }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <LabelWithInfo tip={tip} className={sl}>{label}</LabelWithInfo>
                <Toggle checked={value} onChange={set} />
              </div>
            ))}
            <div className="py-3 space-y-2">
              <LabelWithInfo tip="Shown while the assistant is generating a response" className={sl}>
                Default loading message
              </LabelWithInfo>
              <Input
                value={loadingMessage}
                onChange={(e) => setLoadingMessage(e.target.value)}
                className="bg-gray-100 font-[450]"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <LabelWithInfo tip="Show pre-defined starter prompts on the welcome screen" className={sl}>
                Conversation Starters
              </LabelWithInfo>
              <Toggle checked={conversationStarters} onChange={setConversationStarters} />
            </div>
          </div>
        </AccordionSection>

        <Separator />

        {/* Security */}
        <AccordionSection title="Security" open={securityOpen} onToggle={() => setSecurityOpen(!securityOpen)}>
          <div className="space-y-1.5">
            <LabelWithInfo tip="Require a password before users can access this chatbot" className={sl}>
              Enable Password protection
            </LabelWithInfo>
            <div className="relative">
              <Input placeholder="No password set" className="bg-gray-100 font-[450]" />
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <LabelWithInfo tip="Restrict access to members of your organization via SSO" className={sl}>
              Make it private to your organization (SSO)
            </LabelWithInfo>
            <Toggle checked={ssoEnabled} onChange={setSsoEnabled} />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <LabelWithInfo tip="Only allow this widget to be embedded on specific domains" className={sl}>
              Allowed source URLs
            </LabelWithInfo>
            <Input
              placeholder="https://mywebsite.com/"
              className="bg-gray-100 font-[450] placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              No allowed source URLs configured. Add URLs above to restrict access to specific domains.
            </p>
          </div>
        </AccordionSection>

        <Separator />

        {/* Custom Subdomain */}
        <AccordionSection title="Custom Subdomain" open={subdomainOpen} onToggle={() => setSubdomainOpen(!subdomainOpen)}>
          <div className="space-y-1.5">
            <LabelWithInfo tip="Set a custom subdomain URL for your published chatbot" className={sl}>
              Custom subdomain
            </LabelWithInfo>
            <div className="flex items-center gap-2">
              <Input defaultValue="acme.stack-ai.com" className="bg-gray-100 font-[450]" />
              <button className="px-3 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors shrink-0">
                Save
              </button>
            </div>
          </div>
        </AccordionSection>

        <Separator />

        {/* Share link for chatbot standalone page */}
        <div className="px-5 py-4 bg-emerald-50/50">
          <p className="text-[13px] font-semibold text-foreground mb-2">Share Link</p>
          {workflowId ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={chatSrc}
                className="flex-1 text-[12px] font-mono px-2 py-1.5 rounded-md border bg-white text-foreground truncate"
              />
              <button
                onClick={() => { navigator.clipboard.writeText(chatSrc); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] border rounded-md hover:bg-muted transition-colors shrink-0"
              >
                {codeCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {codeCopied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => window.open(chatSrc, "_blank")}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] border rounded-md hover:bg-muted transition-colors shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">Save your workflow to get a shareable link.</p>
          )}
        </div>

        <Separator />

        {/* Embed */}
        <AccordionSection title="Embed" open={embedOpen} onToggle={() => setEmbedOpen(!embedOpen)}>
          <div className="space-y-2">
            <LabelWithInfo tip="Paste this snippet into the body of your webpage to add a chat bubble" className={sl}>
              Embed code
            </LabelWithInfo>
            {workflowId ? (
              <div className="relative">
                <pre className="text-xs font-mono bg-gray-900 text-gray-100 px-4 py-3.5 rounded-lg overflow-x-auto leading-relaxed whitespace-pre">
                  {embedSnippet}
                </pre>
                <button
                  onClick={handleCopyEmbed}
                  className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-md bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300"
                >
                  {codeCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                Save your workflow first to generate the embed snippet.
              </p>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add this before the closing{" "}
              <code className="font-mono bg-gray-100 px-1 rounded text-foreground">{"</body>"}</code>{" "}
              tag of any webpage where you want the chatbot bubble to appear.
            </p>
          </div>
        </AccordionSection>
      </div>
    </>
  );
}


// ─── Batch config preview (left panel) ───────────────────────────────────────

const BATCH_PUBLISHED_URL =
  "https://www.stackai.com/batch/52331014-8b21-40d6-b84c-c25c51c7d54f/0c0a2948-a659-43b3-bff1-d2be28cfd972/6a13fc2c161ec567691b29b5";

function BatchConfigPreview({ appName }: { appName: string }) {
  const [urlCopied, setUrlCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(BATCH_PUBLISHED_URL);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Published Interface */}
      <div className="space-y-1.5">
        <span className="text-sm text-muted-foreground">Published Interface</span>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={BATCH_PUBLISHED_URL}
            className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg font-mono truncate focus:outline-none"
          />
          <button
            onClick={handleCopyUrl}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-muted transition-colors shrink-0 text-muted-foreground"
          >
            {urlCopied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <span className="text-sm text-muted-foreground block">Draft Preview</span>

      {/* Batch table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* App header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
          <div className="h-14 w-14 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
            <HopIcon className="h-8 w-8 text-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{appName}</h1>
            <p className="text-[14px] font-[450] text-muted-foreground">
              Add a description here so users understand what your agent does.
            </p>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button className="px-3.5 py-1.5 text-[14px] font-[450] text-muted-foreground rounded-md hover:text-foreground transition-colors">
              Resizable
            </button>
            <button className="px-3.5 py-1.5 text-[14px] font-[450] text-foreground bg-white rounded-md shadow-sm border border-gray-200">
              Auto
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-[450] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-foreground">
              <Plus className="h-3.5 w-3.5" />
              Add Run
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 text-[14px] font-[450] bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors">
              <Play className="h-3.5 w-3.5 fill-current" />
              Run Batch
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="w-24 px-4 py-3 text-left text-[14px] font-[450] text-muted-foreground font-normal">
                Actions
              </th>
              <th className="px-4 py-3 text-left border-l border-gray-100">
                <div className="flex items-center gap-1.5 text-[14px] font-[450] text-muted-foreground font-normal">
                  <List className="h-4 w-4 shrink-0" />
                  User Question
                </div>
              </th>
              <th className="px-4 py-3 text-left border-l border-gray-100">
                <div className="flex items-center gap-1.5 text-[14px] font-[450] text-muted-foreground font-normal">
                  <CirclePlus className="h-4 w-4 shrink-0" />
                  Final Answer
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="px-4 py-4">
                <div className="flex items-center gap-1.5">
                  <button className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 text-muted-foreground transition-colors">
                    <Play className="h-3 w-3" />
                  </button>
                  <button className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
              <td className="px-4 py-4 border-l border-gray-100">
                <p className="text-[14px] font-[450] text-muted-foreground">User Question</p>
              </td>
              <td className="px-4 py-4 border-l border-gray-100" />
            </tr>
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <span className="text-[14px] font-[450] text-muted-foreground">
            Page <span className="font-semibold text-foreground">1</span> of 1 (1 runs,{" "}
            <span className="font-semibold text-foreground">0</span> running)
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-[14px] font-[450] border border-gray-200 rounded-lg text-muted-foreground hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1.5 text-[14px] font-[450] border border-gray-200 rounded-lg text-muted-foreground hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Batch settings (right panel) ─────────────────────────────────────────────

function BatchSettings() {
  const [generalOpen, setGeneralOpen] = useState(true);
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [styleOpen, setStyleOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [subdomainOpen, setSubdomainOpen] = useState(true);

  // Fields
  const [caInputs, setCaInputs] = useState<CaInputField[]>(DEFAULT_CA_INPUTS);
  const [caOutputs, setCaOutputs] = useState<CaOutputField[]>(DEFAULT_CA_OUTPUTS);

  const inputDragItem = useRef<number | null>(null);
  const inputDragOver = useRef<number | null>(null);
  const outputDragItem = useRef<number | null>(null);
  const outputDragOver = useRef<number | null>(null);
  const [inputDraggingIdx, setInputDraggingIdx] = useState<number | null>(null);
  const [outputDraggingIdx, setOutputDraggingIdx] = useState<number | null>(null);

  const handleInputDragStart = (i: number) => { inputDragItem.current = i; setInputDraggingIdx(i); };
  const handleInputDragEnter = (i: number) => { inputDragOver.current = i; };
  const handleInputDragEnd = () => {
    if (inputDragItem.current !== null && inputDragOver.current !== null && inputDragItem.current !== inputDragOver.current) {
      const arr = [...caInputs];
      const [item] = arr.splice(inputDragItem.current, 1);
      arr.splice(inputDragOver.current, 0, item);
      setCaInputs(arr);
    }
    inputDragItem.current = null; inputDragOver.current = null; setInputDraggingIdx(null);
  };

  const handleOutputDragStart = (i: number) => { outputDragItem.current = i; setOutputDraggingIdx(i); };
  const handleOutputDragEnter = (i: number) => { outputDragOver.current = i; };
  const handleOutputDragEnd = () => {
    if (outputDragItem.current !== null && outputDragOver.current !== null && outputDragItem.current !== outputDragOver.current) {
      const arr = [...caOutputs];
      const [item] = arr.splice(outputDragItem.current, 1);
      arr.splice(outputDragOver.current, 0, item);
      setCaOutputs(arr);
    }
    outputDragItem.current = null; outputDragOver.current = null; setOutputDraggingIdx(null);
  };

  // Configuration
  const [userFeedback, setUserFeedback] = useState(false);
  const [relatedResults, setRelatedResults] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [showAttachmentIcon, setShowAttachmentIcon] = useState(true);
  const [showAudioIcon, setShowAudioIcon] = useState(true);
  const [collapseSidebar, setCollapseSidebar] = useState(false);
  const [llmTitleGen, setLlmTitleGen] = useState(true);
  const [hideWelcomeAvatar, setHideWelcomeAvatar] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Understanding Request...");
  const [conversationStarters, setConversationStarters] = useState(false);

  // Security
  const [ssoEnabled, setSsoEnabled] = useState(false);

  // Style
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const sl = "text-[14px] font-[450]";

  const configToggles = [
    { label: "User feedback", tip: "Show a thumbs up/down button after each batch run result", value: userFeedback, set: setUserFeedback },
    { label: "Related results", tip: "Show related suggestions after each batch run completes", value: relatedResults, set: setRelatedResults },
    { label: "Show steps", tip: "Display the reasoning steps taken during each run", value: showSteps, set: setShowSteps },
    { label: "Show actions", tip: "Show action buttons available for each run result", value: showActions, set: setShowActions },
    { label: "Show attachment icon", tip: "Allow users to attach files as batch inputs", value: showAttachmentIcon, set: setShowAttachmentIcon },
    { label: "Show audio icon", tip: "Allow users to use audio as batch input", value: showAudioIcon, set: setShowAudioIcon },
    { label: "Collapse sidebar by default", tip: "Start with the run history sidebar collapsed", value: collapseSidebar, set: setCollapseSidebar },
    { label: "Enable LLM title generation", tip: "Automatically generate titles for batch runs using AI", value: llmTitleGen, set: setLlmTitleGen },
    { label: "Hide welcome avatar", tip: "Hide the avatar icon on the welcome screen", value: hideWelcomeAvatar, set: setHideWelcomeAvatar },
  ];

  return (
    <>
      {showAvatarModal && <ImageUploadModal title="Upload Avatar" onClose={() => setShowAvatarModal(false)} />}

      <div className="flex-1 overflow-y-auto">
        {/* General */}
        <AccordionSection title="General" open={generalOpen} onToggle={() => setGeneralOpen(!generalOpen)}>
          <div className="space-y-1.5">
            <LabelWithInfo tip="The name of your batch application" className={cn(sl, "text-muted-foreground")}>
              Name
            </LabelWithInfo>
            <Input defaultValue="Application Name" className="bg-gray-100 font-[450]" />
          </div>
          <div className="space-y-1.5">
            <LabelWithInfo tip="Brief description shown to users of this batch interface" className={cn(sl, "text-muted-foreground")}>
              Description
            </LabelWithInfo>
            <Textarea
              placeholder="Add a description here so users understand what your agent does."
              className="bg-gray-100 font-[450]"
              rows={4}
            />
          </div>
        </AccordionSection>

        <Separator />

        {/* Fields */}
        <AccordionSection title="Fields" open={fieldsOpen} onToggle={() => setFieldsOpen(!fieldsOpen)}>
          {/* Inputs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CircleArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              <LabelWithInfo tip="Map workflow input nodes to columns in the batch table" className="text-sm font-semibold text-foreground">
                Inputs
              </LabelWithInfo>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="w-8 px-2 py-2" />
                    <th className="w-8 px-1 py-2" />
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Node ID</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Alias (optional)</th>
                    <th className="w-14 px-2 py-2 text-center text-xs font-medium text-muted-foreground">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {caInputs.map((field, index) => (
                    <CaInputRow
                      key={field.id}
                      field={field}
                      isDragging={inputDraggingIdx === index}
                      onDragStart={() => handleInputDragStart(index)}
                      onDragEnter={() => handleInputDragEnter(index)}
                      onDragEnd={handleInputDragEnd}
                      onChange={(patch) => setCaInputs((prev) => prev.map((f) => (f.id === field.id ? { ...f, ...patch } : f)))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outputs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CircleArrowLeft className="h-5 w-5 text-muted-foreground shrink-0" />
              <LabelWithInfo tip="Map workflow output nodes to result columns in the batch table" className="text-sm font-semibold text-foreground">
                Outputs
              </LabelWithInfo>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="w-8 px-2 py-2" />
                    <th className="w-8 px-1 py-2" />
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Node ID</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground" colSpan={2}>Alias (optional)</th>
                  </tr>
                </thead>
                <tbody>
                  {caOutputs.map((field, index) => (
                    <CaOutputRow
                      key={field.id}
                      field={field}
                      isDragging={outputDraggingIdx === index}
                      onDragStart={() => handleOutputDragStart(index)}
                      onDragEnter={() => handleOutputDragEnter(index)}
                      onDragEnd={handleOutputDragEnd}
                      onChange={(patch) => setCaOutputs((prev) => prev.map((f) => (f.id === field.id ? { ...f, ...patch } : f)))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AccordionSection>

        <Separator />

        {/* Style */}
        <AccordionSection title="Style" open={styleOpen} onToggle={() => setStyleOpen(!styleOpen)}>
          <div className="space-y-3">
            <span className={cn(sl, "text-muted-foreground")}>Avatar</span>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
                <HopIcon className="h-9 w-9 text-foreground" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Change
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Suggested size is 64 × 64</p>
              </div>
            </div>
          </div>
        </AccordionSection>

        <Separator />

        {/* Configuration */}
        <AccordionSection title="Configuration" open={configOpen} onToggle={() => setConfigOpen(!configOpen)}>
          <div className="divide-y divide-gray-100 -mt-4">
            {configToggles.map(({ label, tip, value, set }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <LabelWithInfo tip={tip} className={sl}>{label}</LabelWithInfo>
                <Toggle checked={value} onChange={set} />
              </div>
            ))}
            <div className="py-3 space-y-2">
              <LabelWithInfo tip="Shown while a batch run is processing" className={sl}>
                Default loading message
              </LabelWithInfo>
              <Input
                value={loadingMessage}
                onChange={(e) => setLoadingMessage(e.target.value)}
                className="bg-gray-100 font-[450]"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <LabelWithInfo tip="Show pre-defined starter prompts on the welcome screen" className={sl}>
                Conversation Starters
              </LabelWithInfo>
              <Toggle checked={conversationStarters} onChange={setConversationStarters} />
            </div>
          </div>
        </AccordionSection>

        <Separator />

        {/* Security */}
        <AccordionSection title="Security" open={securityOpen} onToggle={() => setSecurityOpen(!securityOpen)}>
          <div className="space-y-1.5">
            <LabelWithInfo tip="Require a password before users can access this batch interface" className={sl}>
              Enable Password protection
            </LabelWithInfo>
            <div className="relative">
              <Input placeholder="No password set" className="bg-gray-100 font-[450]" />
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <LabelWithInfo tip="Restrict access to members of your organization via SSO" className={sl}>
              Make it private to your organization (SSO)
            </LabelWithInfo>
            <Toggle checked={ssoEnabled} onChange={setSsoEnabled} />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <LabelWithInfo tip="Only allow this batch interface to be embedded on specific domains" className={sl}>
              Allowed source URLs
            </LabelWithInfo>
            <Input
              placeholder="https://mywebsite.com/"
              className="bg-gray-100 font-[450] placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              No allowed source URLs configured. Add URLs above to restrict access to specific domains.
            </p>
          </div>
        </AccordionSection>

        <Separator />

        {/* Custom Subdomain */}
        <AccordionSection title="Custom Subdomain" open={subdomainOpen} onToggle={() => setSubdomainOpen(!subdomainOpen)}>
          <div className="space-y-1.5">
            <LabelWithInfo tip="Set a custom subdomain URL for your published batch interface" className={sl}>
              Custom subdomain
            </LabelWithInfo>
            <div className="flex items-center gap-2">
              <Input defaultValue="acme.stack-ai.com" className="bg-gray-100 font-[450]" />
              <button className="px-3 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors shrink-0">
                Save
              </button>
            </div>
          </div>
        </AccordionSection>
      </div>
    </>
  );
}

// ─── Form config view ─────────────────────────────────────────────────────────

function FormConfigView({ initialType = "form", workflowId }: { initialType?: InterfaceIdOrNone; workflowId?: string | null }) {
  const [generalOpen, setGeneralOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(true);
  const [subdomainOpen, setSubdomainOpen] = useState(true);
  const [showInGrid, setShowInGrid] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [interfaceType, setInterfaceType] = useState<InterfaceIdOrNone>(initialType);

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
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [formLinkCopied, setFormLinkCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  const APP_URL_FORM = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const formUrl = workflowId ? `${APP_URL_FORM}/form/${workflowId}` : null;
  const iframeEmbed = formUrl ? `<iframe\n  src="${formUrl}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border-radius:12px;border:1px solid #e5e7eb"\n></iframe>` : null;

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

  const settingsLabelClass = "text-[14px] font-[450]";

  return (
    <div className="flex flex-1 overflow-hidden">
      {showCoverModal && (
        <ImageUploadModal title="Change Cover" onClose={() => setShowCoverModal(false)} />
      )}
      {showLogoModal && (
        <ImageUploadModal title="Upload Logo" onClose={() => setShowLogoModal(false)} />
      )}
      {showEmbedModal && (
        <EmbedCodeModal onClose={() => setShowEmbedModal(false)} workflowId={workflowId} />
      )}

      {/* Left — editable form preview */}
      <div className="flex-1 relative overflow-hidden bg-prune-lightGray flex flex-col">
        {/* Left panel header */}
        <div className="shrink-0 px-6 h-[53px] border-b bg-background flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Draft Preview</span>
          {interfaceType === "website-chatbot" && (
            <button
              onClick={() => setShowEmbedModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-muted transition-colors shrink-0"
            >
              <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
              Embed
            </button>
          )}
        </div>
        <div className="flex-1 relative overflow-hidden">
        <div className="h-full overflow-y-auto bg-muted/20 px-8 py-6 space-y-3">
          {interfaceType === "form" ? (
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
          ) : interfaceType === "chat-assistant" ? (
            <ChatAssistantPreview appName={appName} />
          ) : interfaceType === "website-chatbot" ? (
            <WebsiteChatbotConfigPreview appName={appName} />
          ) : interfaceType === "batch" ? (
            <BatchConfigPreview appName={appName} />
          ) : interfaceType === "api" ? (
            <ApiConfigPreview workflowId={workflowId} />
          ) : (
            <InterfaceComingSoon id={interfaceType} />
          )}
        </div>

        {interfaceType === "form" && editingField && (
          <div className="absolute right-0 top-0 h-full w-[360px] bg-background border-l shadow-2xl z-20">
            <FieldEditPanel
              field={editingField}
              onClose={() => setEditingFieldId(null)}
              onChange={(patch) => updateField(editingField.id, patch)}
            />
          </div>
        )}

        {interfaceType === "form" && editingOutput && (
          <div className="absolute right-0 top-0 h-full w-[360px] bg-background border-l shadow-2xl z-20">
            <OutputEditPanel
              output={editingOutput}
              onClose={() => setEditingOutputId(null)}
              onChange={(patch) => updateOutput(editingOutput.id, patch)}
            />
          </div>
        )}
        </div>
      </div>

      {/* Right — settings panel */}
      <div className="w-[620px] shrink-0 border-l bg-background flex flex-col overflow-hidden">
        <div className="px-5 h-[53px] border-b shrink-0 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <InterfaceDropdown value={interfaceType} onChange={setInterfaceType} />
          </div>
        </div>

        <div className="px-5 py-3.5 border-b flex items-center justify-between shrink-0">
          <span className="text-sm text-foreground">Show in Published Agents Grid</span>
          <Toggle checked={showInGrid} onChange={setShowInGrid} />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {interfaceType === "chat-assistant" ? (
            <ChatAssistantSettings workflowId={workflowId} />
          ) : interfaceType === "website-chatbot" ? (
            <WebsiteChatbotSettings workflowId={workflowId} />
          ) : interfaceType === "batch" ? (
            <BatchSettings />
          ) : interfaceType === "api" ? (
            <ApiSettings />
          ) : (
            <>
              {/* Share Link + Embed — form delivery */}
              <div className="px-5 py-4 border-b bg-emerald-50/50">
                <p className="text-[13px] font-semibold text-foreground mb-2">Share Link</p>
                {formUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={formUrl}
                        className="flex-1 text-[12px] font-mono px-2 py-1.5 rounded-md border bg-white text-foreground truncate"
                      />
                      <button
                        onClick={() => { navigator.clipboard.writeText(formUrl); setFormLinkCopied(true); setTimeout(() => setFormLinkCopied(false), 2000); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] border rounded-md hover:bg-muted transition-colors shrink-0"
                      >
                        {formLinkCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {formLinkCopied ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => window.open(formUrl, "_blank")}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] border rounded-md hover:bg-muted transition-colors shrink-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </button>
                    </div>
                    {iframeEmbed && (
                      <div>
                        <p className="text-[12px] text-muted-foreground mb-1">Embed on your website</p>
                        <div className="flex items-start gap-2">
                          <code className="flex-1 text-[11px] font-mono px-2 py-1.5 rounded-md border bg-white text-foreground whitespace-pre-wrap break-all">
                            {iframeEmbed}
                          </code>
                          <button
                            onClick={() => { navigator.clipboard.writeText(iframeEmbed); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2000); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] border rounded-md hover:bg-muted transition-colors shrink-0"
                          >
                            {embedCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            {embedCopied ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[12px] text-muted-foreground">Save your workflow to get a shareable form link.</p>
                )}
              </div>
              <AccordionSection
                title="General"
                open={generalOpen}
                onToggle={() => setGeneralOpen(!generalOpen)}
              >
                <div className="space-y-1.5">
                  <LabelWithInfo
                    tip="The name of your form as it appears to users"
                    className={cn(settingsLabelClass, "text-muted-foreground")}
                  >
                    Name
                  </LabelWithInfo>
                  <Input defaultValue="Application Name" className="bg-gray-100 font-[450]" />
                </div>
                <div className="space-y-1.5">
                  <LabelWithInfo
                    tip="Brief description shown in search results and link previews"
                    className={cn(settingsLabelClass, "text-muted-foreground")}
                  >
                    Meta Description
                  </LabelWithInfo>
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
                  <LabelWithInfo
                    tip="Require a password before users can access this form"
                    className={settingsLabelClass}
                  >
                    Enable Password protection
                  </LabelWithInfo>
                  <div className="relative pt-1">
                    <Input placeholder="No password set" className="bg-gray-100 font-[450]" />
                    <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-4">
                  <LabelWithInfo
                    tip="Restrict access to members of your organization via SSO"
                    className={settingsLabelClass}
                  >
                    Make it private to your organization (SSO)
                  </LabelWithInfo>
                  <Toggle checked={ssoEnabled} onChange={setSsoEnabled} />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <LabelWithInfo
                    tip="Only allow this form to be embedded on specific domains"
                    className={settingsLabelClass}
                  >
                    Allowed source URLs
                  </LabelWithInfo>
                  <Input
                    placeholder="https://mywebsite.com/"
                    className="bg-gray-100 font-[450] placeholder:text-muted-foreground"
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
                  <LabelWithInfo
                    tip="Set a custom subdomain URL for your published form"
                    className={settingsLabelClass}
                  >
                    Custom subdomain
                  </LabelWithInfo>
                  <div className="flex items-center gap-2">
                    <Input defaultValue="acme.pruneai.com" className="bg-gray-100 font-[450]" />
                    <button className="px-3 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              </AccordionSection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root export view ─────────────────────────────────────────────────────────

const ALL_INTERFACES = [...USER_INTERFACES, ...API_INTERFACES];

export function ExportView({ workflowId }: { workflowId?: string | null }) {
  const [selected, setSelected] = useState<InterfaceId | null>(null);
  const [configured, setConfigured] = useState(false);

  const selectedOption = ALL_INTERFACES.find((o) => o.id === selected) ?? null;

  if (configured && selected) {
    return <FormConfigView initialType={selected} workflowId={workflowId} />;
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          {[640, 560, 480, 400, 320, 240].map((r) => (
            <div
              key={r}
              className="absolute rounded-full border border-prune-darkGray opacity-55"
              style={{ width: r * 2, height: r * 2 }}
            />
          ))}
        </div>

        {selected === "form" ? (
          <FormPreview />
        ) : selected === "chat-assistant" ? (
          <ChatPreview />
        ) : selected === "website-chatbot" ? (
          <WebsiteChatbotPreview />
        ) : selected === "batch" ? (
          <BatchPreview />
        ) : selected === "api" ? (
          <ApiPreview />
        ) : (
          <EmptyPreview option={selectedOption} />
        )}
      </div>

      <InterfaceSelectorPanel
        selected={selected}
        onSelect={setSelected}
        onUse={() => setConfigured(true)}
      />
    </div>
  );
}
