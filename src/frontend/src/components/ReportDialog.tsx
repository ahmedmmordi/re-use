import { useState } from "react";
import { Flag } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { createReport, type ReportTargetType, type ReportReason } from "../services/reportService";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "Spam", label: "Spam" },
  { value: "Harassment", label: "Harassment" },
  { value: "HateSpeech", label: "Hate Speech" },
  { value: "FakeOrMisleading", label: "Fake or Misleading" },
  { value: "InappropriateContent", label: "Inappropriate Content" },
  { value: "Violence", label: "Violence" },
  { value: "ScamOrFraud", label: "Scam or Fraud" },
  { value: "Other", label: "Other" },
];

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}

export function ReportDialog({ open, onClose, targetType, targetId }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("Spam");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createReport({ targetType, targetId, reason, notes });
      setSuccess(true);
    } catch {
      setError("Failed to submit. You may have already reported this.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("Spam");
    setNotes("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            Report {targetType}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {success
              ? "Report submitted. Our team will review it."
              : `Select a reason for reporting this ${targetType.toLowerCase()}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!success && (
          <div className="space-y-3 py-1">
            <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            {success ? "Close" : "Cancel"}
          </AlertDialogCancel>
          {!success && (
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
