import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TravelerInfo } from "@/lib/idExtraction";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TravelerFormProps {
  data: TravelerInfo;
  onChange: (data: TravelerInfo) => void;
}

interface FormFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hasIssue?: boolean;
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  hasIssue,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
        {hasIssue && (
          <AlertCircle className="w-3 h-3 text-amber-500" />
        )}
      </Label>
      <Input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "bg-background border-border",
          hasIssue && "border-amber-500 focus-visible:ring-amber-500"
        )}
      />
    </div>
  );
}

export function TravelerForm({ data, onChange }: TravelerFormProps) {
  const updateField = <K extends keyof TravelerInfo>(
    field: K,
    value: TravelerInfo[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const issues = data.issues || [];
  const hasFieldIssue = (field: string) =>
    issues.some((issue) => issue.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Document Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Document Type
        </Label>
        <Select
          value={data.document_type}
          onValueChange={(value) =>
            updateField("document_type", value as TravelerInfo["document_type"])
          }
        >
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="drivers_license">Driver's License</SelectItem>
            <SelectItem value="national_id">National ID</SelectItem>
            <SelectItem value="unknown">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Name Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="First Name"
          value={data.first_name}
          onChange={(v) => updateField("first_name", v)}
          placeholder="John"
          required
          hasIssue={hasFieldIssue("first")}
        />
        <FormField
          label="Last Name"
          value={data.last_name}
          onChange={(v) => updateField("last_name", v)}
          placeholder="Doe"
          required
          hasIssue={hasFieldIssue("last")}
        />
      </div>

      <FormField
        label="Middle Name"
        value={data.middle_name}
        onChange={(v) => updateField("middle_name", v)}
        placeholder="Optional"
        hasIssue={hasFieldIssue("middle")}
      />

      <FormField
        label="Full Legal Name (as shown on document)"
        value={data.full_legal_name}
        onChange={(v) => updateField("full_legal_name", v)}
        placeholder="John Michael Doe"
        required
        hasIssue={hasFieldIssue("name")}
      />

      {/* Personal Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Date of Birth"
          value={data.date_of_birth}
          onChange={(v) => updateField("date_of_birth", v)}
          type="date"
          required
          hasIssue={hasFieldIssue("birth") || hasFieldIssue("dob")}
        />
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Gender <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.gender}
            onValueChange={(value) =>
              updateField("gender", value as TravelerInfo["gender"])
            }
          >
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Male</SelectItem>
              <SelectItem value="F">Female</SelectItem>
              <SelectItem value="X">Non-binary / X</SelectItem>
              <SelectItem value="unknown">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Document Number"
          value={data.document_number}
          onChange={(v) => updateField("document_number", v)}
          placeholder="AB1234567"
          required
          hasIssue={hasFieldIssue("number")}
        />
        <FormField
          label="Expiration Date"
          value={data.expiration_date}
          onChange={(v) => updateField("expiration_date", v)}
          type="date"
          required
          hasIssue={hasFieldIssue("expir")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Issue Date"
          value={data.issue_date}
          onChange={(v) => updateField("issue_date", v)}
          type="date"
          hasIssue={hasFieldIssue("issue")}
        />
        <FormField
          label="Issuing Country"
          value={data.issuing_country}
          onChange={(v) => updateField("issuing_country", v)}
          placeholder="United States"
          hasIssue={hasFieldIssue("country")}
        />
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Nationality"
          value={data.nationality}
          onChange={(v) => updateField("nationality", v)}
          placeholder="American"
          hasIssue={hasFieldIssue("national")}
        />
        <FormField
          label="Place of Birth"
          value={data.place_of_birth}
          onChange={(v) => updateField("place_of_birth", v)}
          placeholder="New York, NY"
          hasIssue={hasFieldIssue("birth")}
        />
      </div>

      {/* Issues Warning */}
      {issues.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Some fields may need review
              </p>
              <ul className="text-sm text-amber-600 dark:text-amber-500 mt-1 space-y-1">
                {issues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
