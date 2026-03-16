"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Send, Pencil, Trash2, Eye, MailOpen } from "lucide-react";

interface EmailList {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  subject: string;
  body: string;
  status: string;
  list_id: string | null;
  sent_count: number;
  open_count: number;
  sent_at: string | null;
  created_at: string;
  email_lists: { name: string } | null;
}

const statusLabels: Record<string, string> = {
  draft: "下書き",
  scheduled: "予約済み",
  sending: "送信中",
  sent: "送信済み",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  sent: "default",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [listId, setListId] = useState("");

  const supabase = createClient();

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*, email_lists(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("キャンペーンの取得に失敗しました");
    } else {
      setCampaigns((data as Campaign[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  const fetchLists = useCallback(async () => {
    const { data } = await supabase
      .from("email_lists")
      .select("id, name")
      .order("name");
    setLists((data as EmailList[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    fetchCampaigns();
    fetchLists();
  }, [fetchCampaigns, fetchLists]);

  const resetForm = () => {
    setSubject("");
    setBody("");
    setListId("");
  };

  const handleCreate = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("件名と本文は必須です");
      return;
    }

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subject.trim(),
        body: body.trim(),
        list_id: listId || null,
      }),
    });

    if (res.ok) {
      toast.success("キャンペーンを作成しました");
      resetForm();
      setCreateOpen(false);
      fetchCampaigns();
    } else {
      const data = await res.json();
      toast.error(data.error || "作成に失敗しました");
    }
  };

  const handleUpdate = async () => {
    if (!editingCampaign || !subject.trim() || !body.trim()) return;

    const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subject.trim(),
        body: body.trim(),
        list_id: listId || null,
      }),
    });

    if (res.ok) {
      toast.success("キャンペーンを更新しました");
      resetForm();
      setEditOpen(false);
      setEditingCampaign(null);
      fetchCampaigns();
    } else {
      const data = await res.json();
      toast.error(data.error || "更新に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このキャンペーンを削除しますか？")) return;

    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });

    if (res.ok) {
      toast.success("キャンペーンを削除しました");
      fetchCampaigns();
    } else {
      toast.error("削除に失敗しました");
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm("このキャンペーンを送信しますか？")) return;

    const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });

    if (res.ok) {
      toast.success("キャンペーンを送信しました");
      fetchCampaigns();
    } else {
      const data = await res.json();
      toast.error(data.error || "送信に失敗しました");
    }
  };

  const openEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setSubject(campaign.subject);
    setBody(campaign.body);
    setListId(campaign.list_id ?? "");
    setEditOpen(true);
  };

  const openPreview = (campaign: Campaign) => {
    setPreviewCampaign(campaign);
    setPreviewOpen(true);
  };

  // Sanitize HTML for safe preview display
  const sanitizeHtml = (html: string) => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
      .replace(/on\w+\s*=\s*'[^']*'/gi, "");
  };

  return (
    <div data-karma-test-id="campaigns-page" data-karma-auth="required">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">キャンペーン</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button data-karma-action="create-campaign">
                <Plus className="mr-2 size-4" />
                新規キャンペーン
              </Button>
            }
          />
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>新規キャンペーン作成</DialogTitle>
              <DialogDescription>
                メールキャンペーンを作成します。
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">編集</TabsTrigger>
                <TabsTrigger value="preview">プレビュー</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="campaign-subject">件名</Label>
                  <Input
                    id="campaign-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="メールの件名"
                    data-karma-test-id="campaign-subject-input"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="campaign-list">配信リスト</Label>
                  <Select
                    value={listId}
                    onValueChange={(v) => setListId(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="リストを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="campaign-body">本文 (HTML)</Label>
                  <Textarea
                    id="campaign-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="<h1>こんにちは</h1><p>メール本文をHTML形式で入力してください。</p>"
                    rows={10}
                    className="font-mono text-sm"
                    data-karma-test-id="campaign-body-input"
                  />
                </div>
              </TabsContent>
              <TabsContent value="preview" className="py-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {subject || "(件名未入力)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(body || "<p>本文未入力</p>"),
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                data-karma-action="submit-create-campaign"
              >
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>キャンペーン編集</DialogTitle>
            <DialogDescription>キャンペーン内容を変更します。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-campaign-subject">件名</Label>
              <Input
                id="edit-campaign-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-campaign-list">配信リスト</Label>
              <Select
                value={listId}
                onValueChange={(v) => setListId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="リストを選択" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-campaign-body">本文 (HTML)</Label>
              <Textarea
                id="edit-campaign-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUpdate}
              data-karma-action="submit-edit-campaign"
            >
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>プレビュー</DialogTitle>
            <DialogDescription>メール内容のプレビュー</DialogDescription>
          </DialogHeader>
          {previewCampaign && (
            <div className="py-4">
              <div className="mb-4 grid gap-1">
                <p className="text-sm text-muted-foreground">
                  件名: <span className="font-medium text-foreground">{previewCampaign.subject}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  リスト: <span className="font-medium text-foreground">{previewCampaign.email_lists?.name ?? "未選択"}</span>
                </p>
              </div>
              <Separator />
              <div
                className="prose prose-sm mt-4 max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(previewCampaign.body),
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Campaign Cards */}
      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              キャンペーンがありません。新規キャンペーンを作成してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} data-karma-entity="email-campaign">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="grid gap-1">
                    <CardTitle className="text-base">
                      {campaign.subject}
                    </CardTitle>
                    <CardDescription>
                      リスト: {campaign.email_lists?.name ?? "未選択"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={statusVariants[campaign.status] ?? "secondary"}
                    data-karma-state={campaign.status}
                  >
                    {statusLabels[campaign.status] ?? campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Send className="size-3.5" />
                      送信: {campaign.sent_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MailOpen className="size-3.5" />
                      開封: {campaign.open_count}
                    </span>
                    <span>
                      作成:{" "}
                      {new Date(campaign.created_at).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openPreview(campaign)}
                      data-karma-action="preview-campaign"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    {campaign.status === "draft" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(campaign)}
                          data-karma-action="edit-campaign"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleSend(campaign.id)}
                          data-karma-action="send-campaign"
                        >
                          <Send className="size-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(campaign.id)}
                      data-karma-action="delete-campaign"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
