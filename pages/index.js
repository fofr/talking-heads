import { useState } from "react";
import Head from "next/head";
import Image from "next/image";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pollPrediction = async (endpoint, id) => {
      let prediction;
      do {
        await sleep(1000);
        const response = await fetch(endpoint + id);
        prediction = await response.json();
        if (response.status !== 200) {
          setError(prediction.detail);
          return null;
        }
      } while (
        prediction.status !== "succeeded" &&
        prediction.status !== "failed"
      );

      return prediction;
    };

    const tortoiseResponse = await fetch("/api/tortoise", {
      ...fetchOptions,
      body: JSON.stringify({ prompt: e.target.prompt.value }),
    });

    const controlnetResponse = await fetch("/api/controlnet", {
      ...fetchOptions,
      body: JSON.stringify({ prompt: e.target.imagePrompt.value }),
    });

    const [tortoisePrediction, controlnetPrediction] = await Promise.all([
      tortoiseResponse.json(),
      controlnetResponse.json(),
    ]);

    if (tortoiseResponse.status !== 201 || controlnetResponse.status !== 201) {
      setError(tortoisePrediction.detail || controlnetPrediction.detail);
      return;
    }

    const [tortoiseResult, controlnetResult] = await Promise.all([
      pollPrediction("/api/tortoise/", tortoisePrediction.id),
      pollPrediction("/api/controlnet/", controlnetPrediction.id),
    ]);

    if (!tortoiseResult || !controlnetResult) {
      return;
    }

    // When both are successful, send a request to the sadtalker endpoint
    const sadtalkerResponse = await fetch("/api/sadtalker", {
      ...fetchOptions,
      body: JSON.stringify({
        driven_audio: tortoiseResult.output,
        source_image: controlnetResult.output[0],
      }),
    });

    const sadtalkerPrediction = await sadtalkerResponse.json();
    if (sadtalkerResponse.status !== 201) {
      setError(sadtalkerPrediction.detail);
      return;
    }

    // Poll for the output of sadtalker/[id]
    const sadtalkerResult = await pollPrediction("/api/sadtalker/", sadtalkerPrediction.id);

    if (!sadtalkerResult) {
      return;
    }

    console.log('done', sadtalkerResult);
  };


  return (
    <div className="container max-w-2xl mx-auto p-5">
      <Head>
        <title>Talking Heads</title>
      </Head>

      <h1 className="py-6 text-center font-bold text-2xl">
        Talking Heads
      </h1>

      <form className="w-full" onSubmit={handleSubmit}>
        <label className="block mb-2" htmlFor="prompt">
          What should they say?
        </label>
        <div class="flex">
          <textarea
            id="prompt"
            type="text"
            rows="3"
            className="flex-grow border-2 border-gray-600 rounded-md p-2"
            name="prompt"
          />
        </div>

        <label className="block mt-4 mb-2" htmlFor="image-prompt">
          What should they look like?
        </label>
        <div class="flex">
          <textarea
            id="image-prompt"
            type="text"
            rows="3"
            className="flex-grow border-2 border-gray-600 rounded-md p-2"
            name="imagePrompt"
          />
        </div>
        <button className="button" type="submit">
          Generate
        </button>
      </form>

      {error && <div>{error}</div>}

      {prediction && (
        <>
          {prediction.output && (
            <div className="image-wrapper mt-5">
              <Image
                fill
                src={prediction.output[prediction.output.length - 1]}
                alt="output"
                sizes="100vw"
              />
            </div>
          )}
          <p className="py-3 text-sm opacity-50">status: {prediction.status}</p>
        </>
      )}
    </div>
  );
}
