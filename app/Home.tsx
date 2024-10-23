"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useRef, useState } from "react";
import useLoadFfmpeg from "./hooks/useLoadFfmpeg";

export default function Home() {
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const { isLoading, loaded, load } = useLoadFfmpeg({ ffmpegRef, messageRef });

  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<string | null>(null);
  console.log("compressedFile: ", compressedFile);
  const [bitrate, setBitrate] = useState(128);
  console.log("bitrate: ", bitrate);

  function fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const binaryString = reader.result as string;
        const len = binaryString.length;
        const uint8Array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
        resolve(uint8Array);
      };

      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      reader.readAsBinaryString(file);
      // reader.readAsArrayBuffer(file);
    });
  }

  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;

    if (!file) {
      console.warn("No file attached");
      return;
    }

    const fileData = await fileToUint8Array(file);
    console.log("fileData: ", fileData);
    await ffmpeg.writeFile("input.avi", fileData);

    await ffmpeg.exec(["-i", "input.avi", "-b:v", "64k", "output.mp4"]);
    const data = (await ffmpeg.readFile("output.mp4")) as any;
    if (videoRef.current) {
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
      console.log("url: ", url);
      videoRef.current.src = url;
      setCompressedFile(url);
    }
  };

  return loaded ? (
    <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
      <form>
        <input
          type="file"
          accept="video/mp4"
          onChange={(e) => {
            const fileInput = e.target as HTMLInputElement;
            const videoFile = fileInput.files?.[0];
            console.log("videoFile: ", videoFile);
            if (videoFile) {
              setFile(videoFile);
            }
          }}
        />
        <select
          onChange={(e) => setBitrate(parseInt(e.target.value))}
          defaultValue={String(bitrate)}
        >
          <option value="64">64</option>
          <option value="128">128</option>
          <option value="256">256</option>
        </select>
      </form>
      <video ref={videoRef} controls></video>
      <br />
      <button
        onClick={transcode}
        className="bg-green-500 hover:bg-green-700 text-white py-3 px-6 rounded"
      >
        Transcode avi to mp4
      </button>
      <p ref={messageRef}></p>
      {compressedFile && (
        <a href={compressedFile} download="compressed.mp4">
          DOWNLOAD
        </a>
      )}
    </div>
  ) : (
    <button
      className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex items-center bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
      onClick={load}
    >
      Load ffmpeg-core
      {isLoading && (
        <span className="animate-spin ml-3">
          <svg
            viewBox="0 0 1024 1024"
            focusable="false"
            data-icon="loading"
            width="1em"
            height="1em"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
          </svg>
        </span>
      )}
    </button>
  );
}
