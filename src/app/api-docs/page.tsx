import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./ReactSwagger";

export default async function IndexPage() {
  const spec = getApiDocs() as Record<string, unknown>;

  return (
    <main className="container mx-auto px-4 py-8">
      <ReactSwagger spec={spec} />
    </main>
  );
}
