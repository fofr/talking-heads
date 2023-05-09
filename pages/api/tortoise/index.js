import createApiHandler from "../api-handler";

const handler = createApiHandler(
  "e9658de4b325863c4fcdc12d94bb7c9b54cbfe351b7ca1b36860008172b91c71",
  (body) => ({
    text: body.prompt,
    voice_a: "william",
  })
);

export default handler;
