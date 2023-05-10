import createApiHandler from "../api-handler";

const handler = createApiHandler(
  "fe97435bfd17881fadfb8e290ebbf172f5835ac2ee015509d9d66b61a24bc5d3",
  (body) => ({
    prompt: body.prompt,
    n_prompt: "topless, nude, nsfw, ugly, garish, tacky, kitsch, vulgar, tasteless",
    a_prompt: "detailed, 8k, 32k uhd, award winning, interesting",
    structure: "pose",
    steps: 40,
    image:
      "https://cdn.discordapp.com/attachments/999037445049954324/1105606197891047584/fofr_a_portrait_photo_of_a_beautiful_man_looking_at_the_camera__a257529e-a6c4-488c-87a9-e667d7712384.png",
  })
);

export default handler;
