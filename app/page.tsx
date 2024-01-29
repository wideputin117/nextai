// have to use useclient  for using hooks
'use client'
import { ModeToggle } from '@/components/them-toggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Camera, FlipHorizontal, MoonIcon, PersonStanding, SunIcon, Video, Volume2 } from 'lucide-react'; // this is an lucid-icon
import { Rings } from 'react-loader-spinner';
import React, { use, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { beep } from '@/utils/audio';
import SocialMediaLinks from '@/components/social_media';
import * as cocossd from '@tensorflow-models/coco-ssd';
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { DetectedObject, ObjectDetection } from '@tensorflow-models/coco-ssd';
import { drawOnCanvas } from '@/utils/draw';

type Props={

}
let interval: any= null;
let stopTimeout: any= null;
const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null); // will return webcam object
  const canvasRef = useRef<HTMLCanvasElement>(null);
  //mirror state
  const [mirrored, setMirrored]= useState<boolean>(false);
  // state for rcording
  const [isRecording, setIsRecording] = useState<Boolean>(false);
  // state handling for autoRecord
  const [autoRecordEnabled, setautoRecordEnabled] = useState<Boolean>(false);
 // for setting the volume
 const [volume, setVolume] = useState(0.8)
 // for loading
const [loading, setLoading] = useState<Boolean>(false);
 const [model, setModel] = useState<ObjectDetection>();
// media recorder
const mediaRecorderRef= useRef<MediaRecorder | null>(null);
// initialize the media recorder
useEffect(() => {
  if (webcamRef && webcamRef.current) {
    const stream = (webcamRef.current.video as any).captureStream();
    if (stream) {
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          const recordedBlob = new Blob([e.data], { type: 'video' });
          const videoURL = URL.createObjectURL(recordedBlob);

          const a = document.createElement('a');
          a.href = videoURL;
          a.download = `${formatDate(new Date())}.webm`;
          a.click();
        }
      };
      mediaRecorderRef.current.onstart = (e) => {
        setIsRecording(true);
      }
      mediaRecorderRef.current.onstop = (e) => {
        setIsRecording(false);
      }
    }
  }
}, [webcamRef])

 // load the cocossd models
 useEffect(() => {
    setLoading(true);
    initModel()
   
 }, [])

 // after loading the  model will set state in model
 async function initModel() {
  const loadModels: ObjectDetection = await cocossd.load({
    base: 'mobilenet_v2'
  });
  // after loading the model will set model state to model
  setModel(loadModels);
 }
  
 // another useEffect function for if model is loaded will set setLoading to false
  useEffect(()=>{
    if(model){
      setLoading(false)
    }
  },[model]);
// function for detecting the person or object
async function runPrediction() {
  if (
    model
    && webcamRef.current
    && webcamRef.current.video
    && webcamRef.current.video.readyState === 4
  ) {
    const predictions: DetectedObject[] = await model.detect(webcamRef.current.video);

    resizeCanvas(canvasRef, webcamRef);
    drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext('2d'))

    let isPerson: boolean = false;
    if (predictions.length > 0) {
      predictions.forEach((prediction) => {
        isPerson = prediction.class === 'person';
      })

      if (isPerson && autoRecordEnabled) {
        setIsRecording(true);
      }
    }
  }
}


  // useEffect for detecting
  useEffect(()=>{
    interval= setInterval(()=>{
      runPrediction();
    },100)
    return  ()=> clearInterval(interval); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[webcamRef.current, model, mirrored, autoRecordEnabled, runPrediction])

///////////////////////////////////////////////////////////////////

  const Mirrortext=()=>{
    if (!mirrored) {
      return(<> 
      <p className='w-fit text-wrap text-center'>
        Not Mirrored
      </p>
        </>)
    }
    return(<>
    <p>Mirrored</p>
    </>)
  }

  // handler functions
  function userPromptScreenshot() {

  }
  // video recording functions
  function userPromptRecord() {
    setIsRecording((prev)=> !prev)
  }
  // function for auto record
  function toggleAutoRecord() {
      if(autoRecordEnabled){
        setautoRecordEnabled(false);
        // showing toast when disabled
        toast('AutoRecord disabled') 
      }
      else{
        setautoRecordEnabled(true);
        // show toast for enabling the autorecord
        toast('AutoRecord enabled') 
      }

  }


  function RenderFeatureHighlightsSection() {
    return <div className="text-xs text-muted-foreground">
      <ul className="space-y-4">
        <li>
          <strong>Dark Mode/Sys Theme 🌗</strong>
          <p>Toggle between dark mode and system theme.</p>
          <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
            <SunIcon size={14} />
          </Button>{" "}
          /{" "}
          <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
            <MoonIcon size={14} />
          </Button>
        </li>
        <li>
          <strong>Horizontal Flip ↔️</strong>
          <p>Adjust horizontal orientation.</p>
          <Button className='h-6 w-6 my-2'
            variant={'outline'} size={'icon'}
            onClick={() => {
              setMirrored((prev) => !prev)
            }}
          ><FlipHorizontal size={14} /></Button>
        </li>
        <Separator />
        <li>
          <strong>Take Pictures 📸</strong>
          <p>Capture snapshots at any moment from the video feed.</p>
          <Button
            className='h-6 w-6 my-2'
            variant={'outline'} size={'icon'}
            onClick={userPromptScreenshot}
          >
            <Camera size={14} />
          </Button>
        </li>
        <li>
          <strong>Manual Video Recording 📽️</strong>
          <p>Manually record video clips as needed.</p>
          <Button className='h-6 w-6 my-2'
            variant={isRecording ? 'destructive' : 'outline'} size={'icon'}
            onClick={userPromptRecord}
          >
            <Video size={14} />
          </Button>
        </li>
        <Separator />
        <li>
          <strong>Enable/Disable Auto Record 🚫</strong>
          <p>
            Option to enable/disable automatic video recording whenever
            required.
          </p>
          <Button className='h-6 w-6 my-2'
            variant={autoRecordEnabled ? 'destructive' : 'outline'}
            size={'icon'}
            onClick={toggleAutoRecord}
          >
            {autoRecordEnabled ? <Rings color='white' height={30} /> : <PersonStanding size={14} />}

          </Button>
        </li>

        <li>
          <strong>Volume Slider 🔊</strong>
          <p>Adjust the volume level of the notifications.</p>
        </li>
        <li>
          <strong>Camera Feed Highlighting 🎨</strong>
          <p>
            Highlights persons in{" "}
            <span style={{ color: "#FF0F0F" }}>red</span> and other objects in{" "}
            <span style={{ color: "#00B612" }}>green</span>.
          </p>
        </li>
        <Separator />
        <li className="space-y-4">
          <strong>Share your thoughts 💬 </strong>
          <SocialMediaLinks/>
          <br />
          <br />
          <br />
        </li>
      </ul>
    </div>
  }




  return (
   <div className='flex h-screen'>
    {/* lEFT div for webcam and canvas  canvas is ontop of whole webcam for detecting the object */}
      <div className='relative'>
        <div className='relative h-screen w-full'>
          <Webcam ref={webcamRef}
          mirrored={mirrored} 
          className='h-full w-full object-contain p-2'/>

          <canvas ref={canvasRef} className='absolute top-0 left-0 h-full w-full object-contain'>
            
          </canvas>
        </div>  
      </div>
      {/* right side div for buttons and other pannels */}
      <div className='flex flex-row flex-1'>
        <div className='border-primary/5 border-2 max-w-xs flex flex-col gap-2 justify-between shadow-md'>
          {/* top section */}
          <div className='flex flex-col gap-2'>
            <ModeToggle />
 
            <Button variant={'outline'} size={'icon'}
                onClick={()=>{setMirrored((prev)=> !prev)}}>
                  <FlipHorizontal />
                </Button>
                    <Mirrortext />
             <Separator className='my-2' />
          </div>
        <div className='flex flex-col gap-2'>
          {/* Button for screenshot */}
          <Separator className='my-2' />
            <Button
              variant={'outline'}
              size={'icon'}
              onClick={userPromptScreenshot}>
                <Camera />
            </Button>
          {/* Button for Recording */}

            <Button
              variant={isRecording?'destructive':'outline'}
              size={'icon'}
              onClick={userPromptRecord}>
                <Video />
            </Button>
                      {/* Button for AutoRecording */}

            <Separator className='my-2' />
              <Button
              variant={autoRecordEnabled?'destructive':'outline'}
              size={'icon'}
              onClick={toggleAutoRecord}>
                {autoRecordEnabled? <Rings color='white' height={45} />: <PersonStanding />}
              </Button>
             
            </div>
            {/** bottom section   */}
           <div className='flex flex-col gap-2'>
          <Separator className='my-2' />
          <Popover>
              <PopoverTrigger asChild>
                <Button variant={'outline'} size={'icon'}>
                  <Volume2 />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Slider
                  max={1}
                  min={0}
                  step={0.2}
                  defaultValue={[volume]}
                  onValueCommit={(val) => {
                    setVolume(val[0]);
                    beep(val[0]);
                  }}
                />
              </PopoverContent>
            </Popover>
         </div>
        </div>

        <div className='h-full flex-1 py-4 px-2 overflow-y-scroll '>
          <RenderFeatureHighlightsSection />
        </div>
      </div>
      {loading && <div className='z-50 absolute w-full h-full flex items-center justify-center bg-foreground'>
        Getting things ready ... <Rings height={50} color='red' />
        </div> 
      }
   </div>
  )
}

export default HomePage

function resizeCanvas(canvasRef: React.RefObject<HTMLCanvasElement>, webcamRef: React.RefObject<Webcam>) {
   const canvas = canvasRef.current;
   const video= webcamRef.current?.video;

   if((canvas && video)){
    const {videoWidth, videoHeight} = video;
    canvas.width= videoWidth;
    canvas.height = videoHeight;
   }
}
  

// format date
function formatDate(d: Date) {
  const formattedDate =
    [
      (d.getMonth() + 1).toString().padStart(2, "0"),
      d.getDate().toString().padStart(2, "0"),
      d.getFullYear(),
    ]
      .join("-") +
    " " +
    [
      d.getHours().toString().padStart(2, "0"),
      d.getMinutes().toString().padStart(2, "0"),
      d.getSeconds().toString().padStart(2, "0"),
    ].join("-");
  return formattedDate;
}

