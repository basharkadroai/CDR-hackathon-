/**
 * Full-bleed looping video background.
 * `dim` controls the dark overlay strength: 'light' for the landing hero
 * (show the scene's colors), 'dark' for views with lots of text on top
 * (chat thread, creation forms) so content stays legible.
 */
export default function VideoBackground({ dim = 'dark' }: { dim?: 'light' | 'dark' }) {
  return (
    <>
      <video className="dv-bg-video" autoPlay muted loop playsInline preload="auto">
        <source src="/backgrounds/winter.mp4" type="video/mp4" />
      </video>
      <div className={`dv-bg-overlay ${dim === 'light' ? 'is-light' : 'is-dark'}`} />
    </>
  );
}
