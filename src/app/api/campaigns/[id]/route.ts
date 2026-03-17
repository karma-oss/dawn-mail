import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const body = await request.json();
  const subject = String(body.subject || "").trim();
  const campaignBody = String(body.body || "").trim();

  if (!subject || !campaignBody) {
    return NextResponse.json(
      { error: "Subject and body are required" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {
    subject,
    body: campaignBody,
  };

  if (body.list_id !== undefined) {
    updateData.list_id = body.list_id;
  }
  if (body.status !== undefined) {
    updateData.status = body.status;
  }

  const { data, error } = await supabase
    .from("email_campaigns")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", staff.organization_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const { error } = await supabase
    .from("email_campaigns")
    .delete()
    .eq("id", id)
    .eq("organization_id", staff.organization_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
