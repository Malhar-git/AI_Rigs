import { apiGet, apiPost } from "./api-client";
import { BuildResponse, WizardAnswersDTO } from "./types";

export function createBuild(dto: WizardAnswersDTO){
  return apiPost<BuildResponse>("/api/builds",dto);
}
export function getBuild(id: string){
  return apiGet<BuildResponse>(`/api/builds/${id}`);
}