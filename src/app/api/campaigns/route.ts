import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!staff) {
    return NextResponse.json({ error: "No staff" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*, email_lists(name)")
    .eq("organization_id", staff.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const subject = String(body.subject || "").trim();
  const campaignBody = String(body.body || "").trim();
  const listId = body.list_id || null;

  if (!subject || !campaignBody) {
    return NextResponse.json(
      { error: "Subject and body are required" },
      { status: 400 }
    );
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!staff) {
    return NextResponse.json({ error: "No staff" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("email_campaigns")
    .insert({
      subject,
      body: campaignBody,
      list_id: listId,
      organization_id: staff.organization_id,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
