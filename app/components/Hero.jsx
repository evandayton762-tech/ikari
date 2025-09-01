export default function Hero() {
    return (
      <section className="relative h-[70vh] flex items-center justify-center bg-primary">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero.mp4"      /* put hero.mp4 in /public */
          autoPlay muted loop
        />
        {/* optional transparent overlay; drop overlay.png in /public */}
        {/* <img src="/overlay.png" className="absolute inset-0 mix-blend-screen pointer-events-none" alt="" /> */}
        <h1 className="relative z-10 font-heading text-6xl md:text-8xl tracking-wide">
          IKARI
        </h1>
      </section>
    );
  }
  