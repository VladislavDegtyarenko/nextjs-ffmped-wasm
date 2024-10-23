import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { MutableRefObject, useRef, useState } from "react";

type Props = {
  ffmpegRef: MutableRefObject<FFmpeg>;
  messageRef: MutableRefObject<HTMLParagraphElement | null>;
};

const useLoadFfmpeg = (props: Props) => {
  const { ffmpegRef, messageRef } = props;

  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    setLoaded(true);
    setIsLoading(false);
  };

  return { isLoading, loaded, load, messageRef };
};

export default useLoadFfmpeg;
