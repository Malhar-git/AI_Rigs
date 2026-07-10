const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// backend envelope
type ApiResponse<T> = {success: boolean; message: string | null; data: T};

async function handle<T>(res : Response): Promise<T>{
  const json = (await res.json()) as ApiResponse<T>;
  if(!res.ok || !json.success){
    throw new Error(json.message ?? `Request failed (${res.status})`);
  }
  return json.data;
}

export async function apiGet<T>(path : string) : Promise<T>{
  const res = await fetch(`${BASE}${path}`);
  return handle<T>(res);
}

// Benchmark endpoints (/api/benchmarks/*) are NOT wrapped in the ApiResponse
// envelope — they return the payload (a list) directly. Use this instead of
// apiGet for those, so we don't try to unwrap a `.data` that isn't there.
export async function apiGetRaw<T>(path : string) : Promise<T>{
  const res = await fetch(`${BASE}${path}`);
  if(!res.ok){
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path:string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`,{
    method: "POST",
    headers: {"Content-Type" : "application/json"},
    body: JSON.stringify(body),
  });

  return handle<T> (res);
}

