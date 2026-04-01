"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SubmitProposalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pid: string, title: string, body: string) => Promise<void>;
}

export function SubmitProposalModal({ open, onClose, onSubmit }: SubmitProposalModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const pid = `prop-${Date.now()}`;
      await onSubmit(pid, title, body);
      setTitle(""); setBody("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-background border-white/10">
        <DialogHeader>
          <DialogTitle>Submit a Proposal</DialogTitle>
          <DialogDescription>AI will evaluate it before opening to votes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Brief title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} />
          </div>
          <div>
            <Label htmlFor="body">Description</Label>
            <textarea
              id="body"
              className="w-full min-h-[120px] rounded-lg border border-white/10 bg-transparent p-3 text-sm resize-none focus:outline-none focus:border-accent"
              placeholder="Describe your proposal in detail..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-muted-foreground hover:border-white/20 transition">Cancel</button>
            <button onClick={handleSubmit} disabled={loading || !title || !body} className="px-4 py-2 rounded-lg gradient-purple-pink text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all">
              {loading ? "AI is evaluating..." : "Submit"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
