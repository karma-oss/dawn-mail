"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface EmailList {
  id: string;
  name: string;
  created_at: string;
  email_list_members: { count: number }[];
}

export default function ListsPage() {
  const [lists, setLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingList, setEditingList] = useState<EmailList | null>(null);
  const [name, setName] = useState("");

  const supabase = createClient();

  const fetchLists = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_lists")
      .select("*, email_list_members(count)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("リストの取得に失敗しました");
    } else {
      setLists((data as EmailList[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (res.ok) {
      toast.success("リストを作成しました");
      setName("");
      setCreateOpen(false);
      fetchLists();
    } else {
      const data = await res.json();
      toast.error(data.error || "作成に失敗しました");
    }
  };

  const handleUpdate = async () => {
    if (!editingList || !name.trim()) return;

    const res = await fetch(`/api/lists/${editingList.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (res.ok) {
      toast.success("リストを更新しました");
      setName("");
      setEditOpen(false);
      setEditingList(null);
      fetchLists();
    } else {
      const data = await res.json();
      toast.error(data.error || "更新に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このリストを削除しますか？")) return;

    const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });

    if (res.ok) {
      toast.success("リストを削除しました");
      fetchLists();
    } else {
      toast.error("削除に失敗しました");
    }
  };

  const openEdit = (list: EmailList) => {
    setEditingList(list);
    setName(list.name);
    setEditOpen(true);
  };

  return (
    <div data-karma-test-id="lists-page" data-karma-auth="required">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">配信リスト</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button data-karma-action="create-list">
                <Plus className="mr-2 size-4" />
                新規リスト
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>新規リスト作成</DialogTitle>
              <DialogDescription>
                メール配信リストを作成します。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="list-name">リスト名</Label>
                <Input
                  id="list-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: ニュースレター購読者"
                  data-karma-test-id="list-name-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} data-karma-action="submit-create-list">
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>リスト編集</DialogTitle>
            <DialogDescription>リスト名を変更します。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-list-name">リスト名</Label>
              <Input
                id="edit-list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-karma-test-id="edit-list-name-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} data-karma-action="submit-edit-list">
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>リスト一覧</CardTitle>
          <CardDescription>メール配信先リストの管理</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          ) : lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              リストがありません。新規リストを作成してください。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>リスト名</TableHead>
                  <TableHead>メンバー数</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list.id} data-karma-entity="email-list">
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell>
                      {list.email_list_members?.[0]?.count ?? 0}
                    </TableCell>
                    <TableCell>
                      {new Date(list.created_at).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(list)}
                          data-karma-action="edit-list"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(list.id)}
                          data-karma-action="delete-list"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
