import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Howl } from 'howler';

export default function MusicPlayer() {
  const [isMuted, setIsMuted] = useState(true);   // start muted; unmute on click
  const created = useRef(false);
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (created.current) return;
    created.current = true;

    const howl = new Howl({
      src: './Home.mp3',
      loop: true,
      volume: 0.6,
      autoplay: false, // we'll start on first user click
    });

    soundRef.current = howl;
    return () => { howl.unload(); };
  }, []);

  const toggleMute = () => {
    const s = soundRef.current;
    if (!s) return;
    if (isMuted) {
      if (!s.playing()) s.play();
    } else {
      s.pause();
    }
    setIsMuted(!isMuted);
  };

  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-6 right-6 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-4 hover:bg-white/20 transition-all"
      aria-label={isMuted ? 'Play music' : 'Pause music'}
    >
      {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
    </button>
  );
}
