import { put } from "@vercel/blob";

export async function uploadResponse(
  evaluationId: string,
  modelId: string,
  payload: object
): Promise<string> {
  const safeModelId = modelId.replace(/\//g, "-");
  const path = `evals/${evaluationId}/${safeModelId}.json`;

  const blob = await put(path, JSON.stringify(payload), {
    contentType: "application/json",
    access: "public",
  });

  return blob.url;
}

export async function getResponse(blobUrl: string): Promise<object> {
  const res = await fetch(blobUrl);
  if (!res.ok) throw new Error(`Blob not found: ${blobUrl}`);
  return res.json() as Promise<object>;
}
