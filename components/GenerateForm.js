import React, { useEffect, useState } from 'react';
import Spinner from './Spinner';
import Card from './Card';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GenerateForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioResult, setAudioResult] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [videoResult, setVideoResult] = useState(null);
  const [areResultsReady, setAreResultsReady] = useState(false);

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const barkResponse = await fetch("/api/bark", {
      ...fetchOptions,
      body: JSON.stringify({ prompt: e.target.prompt.value }),
    });

    const controlnetResponse = await fetch("/api/controlnet", {
      ...fetchOptions,
      body: JSON.stringify({ prompt: e.target.imagePrompt.value }),
    });

    const [barkPrediction, controlnetPrediction] = await Promise.all([
      barkResponse.json(),
      controlnetResponse.json(),
    ]);

    if (barkResponse.status !== 201 || controlnetResponse.status !== 201) {
      setError(barkPrediction.detail || controlnetPrediction.detail);
      setIsSubmitting(false);
      return;
    }

    const pollbark = async () => {
      const barkResult = await pollPrediction("/api/bark/", barkPrediction.id);
      if (barkResult) {
        setAudioResult(barkResult.output.audio_out);
      }
    };

    const pollControlnet = async () => {
      const controlnetResult = await pollPrediction("/api/controlnet/", controlnetPrediction.id);
      if (controlnetResult) {
        setImageResult(controlnetResult.output[0]);
      }
    };

    await Promise.allSettled([
      pollbark(),
      pollControlnet(),
    ]);

    setAreResultsReady(true);
  };

  useEffect(() => {
    if (!areResultsReady) return;

    async function sadTalker () {
      const sadtalkerResponse = await fetch("/api/sadtalker", {
        ...fetchOptions,
        body: JSON.stringify({
          driven_audio: audioResult,
          source_image: imageResult,
        }),
      });

      const sadtalkerPrediction = await sadtalkerResponse.json();
      if (sadtalkerResponse.status !== 201) {
        setError(sadtalkerPrediction.detail);
        return;
      }

      const sadtalkerResult = await pollPrediction("/api/sadtalker/", sadtalkerPrediction.id);

      if (sadtalkerResult) {
        setVideoResult(sadtalkerResult.output);
      } else {
        return
      }
    }

    sadTalker();
  }, [audioResult, imageResult, areResultsReady]);

  return (
    <div>
      {!isSubmitting && (
        <form className="w-full" onSubmit={handleSubmit}>
          <label className="block mb-2" htmlFor="prompt">
            What should they say?
          </label>
          <div className="flex">
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
          <div className="flex">
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
      )}

      <div>
        {isSubmitting && (
          <div>
            <Card heading="Audio">
              {!audioResult && (
                <div className="justify-center">
                  <Spinner />
                </div>
              )}
              {audioResult && (
                <div>
                  <audio src={audioResult} controls />
                </div>
              )}
            </Card>

            <Card heading="Image">
              {!imageResult && (
                <div className="justify-center">
                  <Spinner />
                </div>
              )}

              {imageResult && (
                <div>
                  <img src={imageResult} alt="Generated image" className="w-full" />
                </div>
              )}
            </Card>

            {imageResult && audioResult && (
            <Card heading="Video">
              {!videoResult && (
                <div className="justify-center">
                  <Spinner />
                </div>
              )}

              {videoResult && (
                <video src={videoResult} controls className="w-full" />
              )}
            </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateForm;
