import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: students, error } = await supabase
      .from("students")
      .select("student_id, name, department, final_marks, attendance")
      .order("final_marks", { ascending: true });

    if (error) throw error;

    const atRisk = (students ?? []).filter(
      (s: { final_marks: number; attendance: number }) =>
        s.final_marks < 50 || s.attendance < 65,
    );

    const notifications = atRisk.map((s: { student_id: string; name: string; department: string; final_marks: number; attendance: number }) => ({
      student_id: s.student_id,
      name: s.name,
      department: s.department,
      final_marks: s.final_marks,
      attendance: s.attendance,
      message: `Dear ${s.name}, your current performance indicates you may be at risk. Final marks: ${s.final_marks}, Attendance: ${s.attendance}%. Please consult your faculty advisor for a support plan.`,
    }));

    return new Response(
      JSON.stringify({
        total_students: students?.length ?? 0,
        at_risk_count: atRisk.length,
        notifications,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
