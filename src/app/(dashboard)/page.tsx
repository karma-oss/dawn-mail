import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, FileText, MailOpen } from "lucide-react";

export default async function DashboardPage() {
  await requireUser();
  const supabase = await createClient();

  const { count: totalCampaigns } = await supabase
    .from("email_campaigns")
    .select("*", { count: "exact", head: true });

  const { count: sentCount } = await supabase
    .from("email_campaigns")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent");

  const { count: draftCount } = await supabase
    .from("email_campaigns")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  const stats = [
    {
      title: "総キャンペーン数",
      value: totalCampaigns ?? 0,
      icon: Send,
      description: "全てのキャンペーン",
    },
    {
      title: "送信済み",
      value: sentCount ?? 0,
      icon: MailOpen,
      description: "送信完了キャンペーン",
    },
    {
      title: "下書き",
      value: draftCount ?? 0,
      icon: FileText,
      description: "未送信キャンペーン",
    },
  ];

  return (
    <div data-karma-test-id="dashboard-page" data-karma-auth="required">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">ダッシュボード</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} data-karma-entity="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
