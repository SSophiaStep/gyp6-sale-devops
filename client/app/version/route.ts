// Ендпоінт /version: версію підставляє CI з git-тега (див. release.yml)

const APP_VERSION = "dev";

export function GET() {
  return Response.json({ name: "gyp6-sale", version: APP_VERSION });
}
