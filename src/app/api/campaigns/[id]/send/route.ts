import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
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

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from("email_campaigns")
    .select("*, email_lists(name)")
    .eq("id", id)
    .eq("organization_id", staff.organization_id)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  if (campaign.status === "sent" || campaign.status === "sending") {
    return NextResponse.json(
      { error: "Campaign already sent or sending" },
      { status: 400 }
    );
  }

  // Update status to sending
  await supabase
    .from("email_campaigns")
    .update({ status: "sending" })
    .eq("id", id);

  // Get list members with contact emails
  const { data: members } = await supabase
    .from("email_list_members")
    .select("contacts(email, name)")
    .eq("list_id", campaign.list_id)
    .is("unsubscribed_at", null);

  let sentCount = 0;

  if (members && members.length > 0) {
    for (const member of members) {
      const contact = member.contacts as unknown as {
        email: string;
        name: string;
      } | null;
      if (!contact?.email) continue;

      try {
        await resend.emails.send({
          from: "DAWN MAIL <noreply@resend.dev>",
          to: [contact.email],
          subject: campaign.subject,
          html: campaign.body,
        });
        sentCount++;
      } catch {
        // Log error but continue sending to other recipients
        console.error(`Failed to send to ${contact.email}`);
      }
    }
  }

  // Update campaign as sent
  const { data: updated, error: updateError } = await supabase
    .from("email_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
