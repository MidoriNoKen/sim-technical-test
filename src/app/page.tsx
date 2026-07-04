export default function Home() {
  return (
    <pre>{JSON.stringify({ status: "API is running" }, null, 2)}</pre>
  );
}
