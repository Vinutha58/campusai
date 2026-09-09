import { ComingSoon } from "@/components/dashboard/ComingSoon";

function toTitle(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const title = slug.map(toTitle).join(" / ");

  return <ComingSoon title={title} />;
}
