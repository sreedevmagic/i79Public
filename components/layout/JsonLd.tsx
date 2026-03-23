type JsonLdSchema = Record<string, unknown> | Record<string, unknown>[];

export default function JsonLd({ schema }: { schema: JsonLdSchema }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
