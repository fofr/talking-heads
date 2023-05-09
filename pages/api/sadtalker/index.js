import createApiHandler from "../api-handler";

const handler = createApiHandler(
  "423fe08772f8e2038f4de16e8dc80f26b5e756732445fd42061ff82d73cb1ba3",
  (body) => ({
    driven_audio: body.driven_audio,
    source_image: body.source_image,
  })
);

export default handler;
