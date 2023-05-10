import React, { useEffect, useState, useRef } from 'react';
import Card from './Card';
import Logs from './Logs';

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GenerateForm = () => {
  const cancelRef = useRef(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [runningPredictions, setRunningPredictions] = useState([]);
  const [audioResult, setAudioResult] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [videoResult, setVideoResult] = useState(null);
  const [areResultsReady, setAreResultsReady] = useState(false);
  const [logs, setLogs] = useState({ bark: '', controlnet: '', sadtalker: '' });
  const [statuses, setStatuses] = useState({ bark: '', controlnet: '', sadtalker: '' });

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  }

  const pollPrediction = async (id, logType) => {
    let prediction;
    setRunningPredictions((prevRunningPredictions) => [
      ...prevRunningPredictions,
      id,
    ]);

    do {
      await sleep(1000);
      const response = await fetch(`/api/${id}`);
      prediction = await response.json();
      if (response.status !== 200) {
        setError(prediction.detail);
        return null;
      }

      setLogs((prevLogs) => ({
        ...prevLogs,
        [logType]: prediction.logs,
      }));

      setStatuses((prevStatuses) => ({
        ...prevStatuses,
        [logType]: `${capitalizeFirstLetter(prediction.status)}…`,
      }));
    } while (
      !cancelRef.current &&
      prediction.status !== "succeeded" &&
      prediction.status !== "canceled" &&
      prediction.status !== "failed"
    );

    setRunningPredictions((prevRunningPredictions) =>
      prevRunningPredictions.filter((runningPrediction) => runningPrediction !== id)
    );

    return prediction;
  };

  const handleNew = (e) => {
    e && e.preventDefault();
    setHasSubmitted(false);
    setAudioResult(null);
    setImageResult(null);
    setVideoResult(null);
    setAreResultsReady(false);
    setLogs({ bark: '', controlnet: '', sadtalker: '' });
    setStatuses({ bark: '', controlnet: '', sadtalker: '' });
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    cancelRef.current = true;
    runningPredictions.forEach((id) => {
      fetch(`/api/${id}?action=cancel`);
    });
    handleNew();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    cancelRef.current = false;
    setHasSubmitted(true);

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
      setHasSubmitted(false);
      return;
    }

    const pollbark = async () => {
      const barkResult = await pollPrediction(barkPrediction.id, 'bark');
      if (barkResult && !cancelRef.current) {
        setAudioResult(barkResult.output.audio_out);
      }
    };

    const pollControlnet = async () => {
      const controlnetResult = await pollPrediction(controlnetPrediction.id, 'controlnet');
      if (controlnetResult && !cancelRef.current) {
        setImageResult(controlnetResult.output[0]);
      }
    };

    await Promise.allSettled([
      pollbark(),
      pollControlnet(),
    ]);

    if (!cancelRef.current) {
      setAreResultsReady(true);
    }

    cancelRef.current = false;
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

      const sadtalkerResult = await pollPrediction(sadtalkerPrediction.id, 'sadtalker');

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
      {!hasSubmitted && (
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
        {hasSubmitted && (
          <div>
            <Card heading="Audio">
              {!audioResult && (
                <Logs logs={logs.bark} status={statuses.bark} />
              )}
              {audioResult && (
                <div>
                  <audio src={audioResult} controls className="w-full" />
                </div>
              )}
            </Card>

            <Card heading="Image">
              {!imageResult && (
                <Logs logs={logs.controlnet} status={statuses.controlnet} />
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
                  <Logs logs={logs.sadtalker} status={statuses.sadtalker} />
                )}

                {videoResult && (
                  <video src={videoResult} controls className="w-full" />
                )}
              </Card>
            )}

            <div className="flex flex-row items-center">
              <button
                className="button inline mt-4 mr-4"
                onClick={handleNew}
              >
                Make another video
              </button>

              <button
                className="button button-secondary mt-4"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateForm;
