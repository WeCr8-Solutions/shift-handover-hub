/**
 * Compatibility shim — the underlying table was renamed to `certifying_mentors`
 * and now supports a JobLine-platform tier plus per-program approval.
 *
 * New code should import from `useCertifyingMentors`. This file keeps the old
 * `useOapMentors` name working for components that have not yet migrated.
 */
import { useCertifyingMentors, type CertifyingMentor } from "./useCertifyingMentors";

export type OapMentor = CertifyingMentor;

export function useOapMentors() {
  const inner = useCertifyingMentors({ program: "OAP", scope: "org" });
  return {
    mentors: inner.mentors,
    isLoading: inner.isLoading,
    designate: inner.designate,
    setActive: inner.setActive,
  };
}
