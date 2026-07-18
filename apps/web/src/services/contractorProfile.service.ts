import type { ContractorProfile } from "@/lib/proposal/types";
import { request } from "./http";

/** Demo Polish — Task 2. */
export const contractorProfileService = {
  get: () => request<ContractorProfile>("/contractor-profile"),
  update: (patch: Partial<ContractorProfile>) =>
    request<ContractorProfile>("/contractor-profile", {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
};
