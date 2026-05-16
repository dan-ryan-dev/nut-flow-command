import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/shared/auth/AuthProvider";
import { Container } from "@/shared/data/types";
import { MessageSquare, Send, Save } from "lucide-react";
import { toast } from "sonner";
import { containersQueryKey } from "@/shared/hooks/useContainers";
import { InlineErrorBanner, SkeletonRows } from "@/shared/components/QueryStates";

type Comment = {
  id: string;
  body: string;
  author_id: string;
  author_name: string | null;
  created_at: string;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const ShipmentCommentsDialog = ({
  container,
  open,
  onOpenChange,
}: {
  container: Container;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const { user, profile, role } = useAuth();
  const canWrite = role === "coordinator" || role === "admin";
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [po, setPo] = useState(container.purchaseOrder ?? "");
  const [err, setErr] = useState<string | null>(null);

  const commentsQ = useQuery({
    queryKey: ["container_comments", container.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("container_comments")
        .select("id, body, author_id, author_name, created_at")
        .eq("container_id", container.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
    enabled: open,
  });

  const addComment = useMutation({
    mutationFn: async (body: string) => {
      if (!user || !profile?.org_id) throw new Error("Not signed in");
      const { error } = await supabase.from("container_comments").insert({
        container_id: container.id,
        org_id: profile.org_id,
        author_id: user.id,
        author_name: profile.display_name ?? user.email ?? null,
        body,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["container_comments", container.id] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  const savePo = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase
        .from("containers")
        .update({ purchase_order: value || null })
        .eq("container_id", container.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Purchase order updated");
      setErr(null);
      qc.invalidateQueries({ queryKey: containersQueryKey });
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-mono text-sm">{container.id}</span>
            <span className="text-xs text-muted-foreground font-normal">
              · {container.booking}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {container.buyer} · {container.destination}
          </DialogDescription>
        </DialogHeader>

        <InlineErrorBanner message={err} />

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Purchase Order
          </label>
          <div className="flex gap-2">
            <Input
              value={po}
              disabled={!canWrite || savePo.isPending}
              onChange={(e) => setPo(e.target.value)}
              placeholder="e.g. PO-44218"
              className="font-mono text-sm"
            />
            {canWrite && (
              <button
                onClick={() => savePo.mutate(po.trim())}
                disabled={savePo.isPending || po.trim() === (container.purchaseOrder ?? "")}
                className="inline-flex items-center gap-1.5 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                <Save className="w-3 h-3" /> Save
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Comments
          </div>

          {canWrite && (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a note for the team…"
                rows={2}
                className="text-sm resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => draft.trim() && addComment.mutate(draft.trim())}
                  disabled={!draft.trim() || addComment.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                >
                  <Send className="w-3 h-3" /> Post
                </button>
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-md border border-border">
            {commentsQ.isLoading ? (
              <div className="p-3"><SkeletonRows rows={3} rowClassName="h-10" /></div>
            ) : commentsQ.isError ? (
              <div className="p-4 text-xs text-accent">Could not load comments.</div>
            ) : (commentsQ.data ?? []).length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No comments yet.
              </div>
            ) : (
              commentsQ.data!.map((c) => (
                <div key={c.id} className="px-3 py-2.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {c.author_name ?? "Teammate"}
                    </span>
                    <span className="tabular-nums">{fmt(c.created_at)}</span>
                  </div>
                  <div className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
                    {c.body}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};