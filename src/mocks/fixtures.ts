// 假資料一律取自 Postman collection 的 example response，不手寫，避免和真 API 漂移
import collectionJson from '../../docs/postman/dine-restaurant.postman_collection.json';

type PostmanExample = { name: string; code: number; body?: string };
type PostmanItem = { name: string; item?: PostmanItem[]; response?: PostmanExample[] };

const collection = collectionJson as unknown as { item: PostmanItem[] };

function findRequest(items: PostmanItem[], name: string): PostmanItem | undefined {
  for (const item of items) {
    if (item.name === name && item.response) return item;
    const found = item.item && findRequest(item.item, name);
    if (found) return found;
  }
  return undefined;
}

/** 依 Postman 的 request 名稱與 example 名稱取出狀態碼與 body */
export function example<T = unknown>(requestName: string, exampleName: string): { status: number; body: T } {
  const ex = findRequest(collection.item, requestName)?.response?.find((r) => r.name === exampleName);
  if (!ex) throw new Error(`Postman example not found: ${requestName} / ${exampleName}`);
  return { status: ex.code, body: (ex.body ? JSON.parse(ex.body) : null) as T };
}
