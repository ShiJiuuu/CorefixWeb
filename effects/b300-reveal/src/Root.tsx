import { Composition } from "remotion";
import { B300Reveal } from "./B300Reveal";

const FPS = 60;
const DURATION_IN_SECONDS = 5;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="B300Reveal"
        component={B300Reveal}
        durationInFrames={FPS * DURATION_IN_SECONDS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
