/**
 * Type definitions for AwesomeContext MCP Server ↔ FastAPI Backend communication.
 */

export interface LatentQueryRequest {
  intent?: string;
  session_id?: string;
  memory_partition?: string;
  top_k?: number;
  module_type_filter?: string;
  tool_name: string;
  skill_id?: string;
  code?: string;
}

export interface MatchedModule {
  module_id: string;
  name: string;
  module_type: string;
  score: number;
  description: string;
}

export interface QueryMetrics {
  tokens_saved: number;
  retrieval_time_ms: number;
  decode_time_ms: number;
  total_time_ms: number;
  modules_searched: number;
  modules_matched: number;
}

export interface LatentQueryResponse {
  dense_prompt: string;
  latent_id: string;
  session_id: string;
  metrics: QueryMetrics;
  matched_modules: MatchedModule[];
}

export interface ModuleListItem {
  module_id: string;
  name: string;
  module_type: string;
  description: string;
  token_count: number;
}

export interface ModuleListResponse {
  modules: ModuleListItem[];
  total: number;
}
