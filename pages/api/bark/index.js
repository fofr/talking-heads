import createApiHandler from "../api-handler";

const handler = createApiHandler(
  "b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787",
  (body) => {
    // Check if the last character is not '.', '?' or '!'
    if (!/[.?!]$/.test(body.prompt)) {
      body.prompt = `${body.prompt}.`;
    }

    return {
      prompt: body.prompt,
      history_prompt: "announcer",
      text_temp: 0.1,
      waveform_temp: 0.2,
    };
  }
);

export default handler;
