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

export async function apiPost<T>(path:string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`,{
    method: "POST",
    headers: {"Content-Type" : "application/json"},
    body: JSON.stringify(body),
  });

  return handle<T> (res);
}

