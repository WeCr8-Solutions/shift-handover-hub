import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OperatorProfileRow {
  id: string;
  user_id: string;
  headline: string | null;
  bio: string | null;
  years_experience: number | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  resume_pdf_url: string | null;
  avatar_url: string | null;
  willing_to_relocate: boolean;
  open_to_work: boolean;
  is_discoverable: boolean;
  preferred_employment_types: string[] | null;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface OperatorCertRow {
  id: string;
  user_id: string;
  name: string;
  issuer: string | null;
  issued_date: string | null;
  expires_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  attachment_url: string | null;
  verification_source: string;
  linked_cert_id: string | null;
  description: string | null;
}

export interface OperatorSkillRow {
  id: string;
  user_id: string;
  skill: string;
  proficiency: string;
  years_used: number | null;
}

export interface OperatorMachineRow {
  id: string;
  user_id: string;
  machine_category: string;
  machine_make: string | null;
  machine_model: string | null;
  control_type: string | null;
  proficiency: string;
  years_experience: number | null;
  notes: string | null;
}

export interface OperatorWorkHistoryRow {
  id: string;
  user_id: string;
  employer_name: string;
  job_title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  location: string | null;
  description: string | null;
  organization_id: string | null;
}

export interface OperatorEducationRow {
  id: string;
  user_id: string;
  school_name: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

export interface OperatorReferenceRow {
  id: string;
  user_id: string;
  reference_name: string;
  relationship: string | null;
  company: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
}

export function useOperatorProfile(targetUserId?: string) {
  const { user } = useAuth();
  const userId = targetUserId ?? user?.id;
  const [profile, setProfile] = useState<OperatorProfileRow | null>(null);
  const [certifications, setCertifications] = useState<OperatorCertRow[]>([]);
  const [skills, setSkills] = useState<OperatorSkillRow[]>([]);
  const [machines, setMachines] = useState<OperatorMachineRow[]>([]);
  const [workHistory, setWorkHistory] = useState<OperatorWorkHistoryRow[]>([]);
  const [education, setEducation] = useState<OperatorEducationRow[]>([]);
  const [references, setReferences] = useState<OperatorReferenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [p, c, s, m, w, e, r] = await Promise.all([
        supabase.from("operator_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("operator_certifications").select("*").eq("user_id", userId).order("issued_date", { ascending: false, nullsFirst: false }),
        supabase.from("operator_skills").select("*").eq("user_id", userId).order("skill"),
        supabase.from("operator_machine_proficiencies").select("*").eq("user_id", userId).order("machine_category"),
        supabase.from("operator_work_history").select("*").eq("user_id", userId).order("start_date", { ascending: false, nullsFirst: false }),
        supabase.from("operator_education").select("*").eq("user_id", userId).order("end_date", { ascending: false, nullsFirst: false }),
        supabase.from("operator_references").select("*").eq("user_id", userId).order("reference_name"),
      ]);
      setProfile((p.data as OperatorProfileRow | null) ?? null);
      setCertifications((c.data as OperatorCertRow[] | null) ?? []);
      setSkills((s.data as OperatorSkillRow[] | null) ?? []);
      setMachines((m.data as OperatorMachineRow[] | null) ?? []);
      setWorkHistory((w.data as OperatorWorkHistoryRow[] | null) ?? []);
      setEducation((e.data as OperatorEducationRow[] | null) ?? []);
      setReferences((r.data as OperatorReferenceRow[] | null) ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Upsert top-level profile fields (creates the row if missing). */
  const saveProfile = useCallback(async (patch: Partial<OperatorProfileRow>) => {
    if (!user?.id) throw new Error("Not authenticated");
    const payload = { user_id: user.id, ...patch };
    const { error } = await supabase
      .from("operator_profiles")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
    await refresh();
  }, [user?.id, refresh]);

  /** Upload a file (resume, cert attachment, avatar) to operator-profiles bucket and return public URL. */
  const uploadFile = useCallback(async (file: File, folder: "resume" | "certs" | "avatar"): Promise<string> => {
    if (!user?.id) throw new Error("Not authenticated");
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("operator-profiles").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("operator-profiles").getPublicUrl(path);
    return data.publicUrl;
  }, [user?.id]);

  return {
    profile,
    certifications,
    skills,
    machines,
    workHistory,
    education,
    references,
    loading,
    error,
    refresh,
    saveProfile,
    uploadFile,
  };
}

/** Sync OAP/GCA issued certificates into operator_certifications as 'verified_*' rows. */
export async function syncIssuedCertificatesToProfile(userId: string, email: string) {
  // OAP
  const { data: oap } = await supabase
    .from("oap_certificates")
    .select("cert_id, program_name, issued_at, valid_until, pdf_url")
    .eq("recipient_email", email)
    .eq("status", "active");
  // GCA
  const { data: gca } = await supabase
    .from("gca_certificates")
    .select("cert_id, program_name, issued_at, valid_until, pdf_url")
    .eq("recipient_email", email)
    .eq("status", "active");

  const rows: Array<Omit<OperatorCertRow, "id">> = [];
  for (const c of oap ?? []) {
    rows.push({
      user_id: userId,
      name: c.program_name,
      issuer: "JobLine OAP",
      issued_date: c.issued_at?.split("T")[0] ?? null,
      expires_date: c.valid_until?.split("T")[0] ?? null,
      credential_id: c.cert_id,
      credential_url: `${window.location.origin}/verify/${c.cert_id}`,
      attachment_url: c.pdf_url,
      verification_source: "verified_oap",
      linked_cert_id: c.cert_id,
      description: null,
    });
  }
  for (const c of gca ?? []) {
    rows.push({
      user_id: userId,
      name: c.program_name,
      issuer: "JobLine GCA",
      issued_date: c.issued_at?.split("T")[0] ?? null,
      expires_date: c.valid_until?.split("T")[0] ?? null,
      credential_id: c.cert_id,
      credential_url: `${window.location.origin}/verify/${c.cert_id}`,
      attachment_url: c.pdf_url,
      verification_source: "verified_gca",
      linked_cert_id: c.cert_id,
      description: null,
    });
  }

  if (!rows.length) return 0;

  // Upsert by linked_cert_id (avoid duplicates)
  for (const row of rows) {
    const { data: existing } = await supabase
      .from("operator_certifications")
      .select("id")
      .eq("user_id", userId)
      .eq("linked_cert_id", row.linked_cert_id ?? "")
      .maybeSingle();
    if (existing) {
      await supabase.from("operator_certifications").update(row).eq("id", existing.id);
    } else {
      await supabase.from("operator_certifications").insert(row);
    }
  }
  return rows.length;
}
