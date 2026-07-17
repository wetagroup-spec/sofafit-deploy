import { Link } from "react-router";
import {
  Ruler,
  Palette,
  Images,
  Armchair,
  MapPin,
  ImageOff,
  Timer,
  Box,
  ArrowRight,
  Star,
  Plus,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import { examplePhotoUrl } from "@/lib/upload";

const benefits = [
  {
    icon: Ruler,
    title: "Scale-accurate fit",
    text: "Precise room dimensions and true-to-size sofa (or any furniture) placement.",
  },
  {
    icon: Palette,
    title: "Desired color",
    text: "Preview the exact upholstery color your buyer is considering.",
  },
  {
    icon: Images,
    title: "Many angles, one fitting",
    text: "A full set of photos from different angles during a single fitting.",
  },
  {
    icon: Armchair,
    title: "In the real interior",
    text: "The sofa is rendered inside the customer's actual room — not a showroom.",
  },
  {
    icon: MapPin,
    title: "You pick the spot",
    text: "Tell us exactly where to place the sofa in the room.",
  },
  {
    icon: ImageOff,
    title: "No room photo needed",
    text: "Works even without a photo of the customer's room.",
  },
  {
    icon: Timer,
    title: "15–30 minutes",
    text: "Human-managed previews delivered while the buyer is still hot.",
  },
  {
    icon: Box,
    title: "No 3D model required",
    text: "A photo of the sofa from your website or store is enough.",
  },
];

const reviews = [
  {
    name: "Elena Marchenko",
    role: "Head of E-commerce, MebelVita (Berlin)",
    text: "We send previews to hesitant buyers the same evening. Our sofa conversion rate grew by a third in two months, and returns dropped noticeably — people finally know what arrives.",
    stars: 5,
  },
  {
    name: "David Klein",
    role: "Founder, Klein & Sons Furniture (Vienna)",
    text: "The scale accuracy is what sold us. Customers stopped asking “will it fit?” — they just look at the pictures from five angles and order. The 30-minute turnaround feels like magic.",
    stars: 5,
  },
  {
    name: "Sofia Petrova",
    role: "Sales Director, DivanMarket (Warsaw)",
    text: "No 3D models, no complicated setup — we upload a product photo and get studio-quality room previews. It paid for itself within the first week of high-intent leads.",
    stars: 5,
  },
];

// Fallback demo content — shown when the API/database is not reachable,
// so the landing page always renders.
const DEMO_EXAMPLE = {
  title: "Olive corner sofa — room 710 cm",
  subtitle: "Fitting for a high-intent buyer, delivered in 22 minutes",
  photos: [
    { src: "/demo/room.jpg", caption: "Room photo. Width 710 cm." },
    { src: "/demo/color.jpg", caption: "Desired color." },
    { src: "/demo/sofa.jpg", caption: "Sofa model. Size 450×270 cm." },
    { src: "/demo/result1.jpg", caption: "Preview: placed by the window, true to scale." },
    { src: "/demo/result2.jpg", caption: "Second angle from the same fitting." },
  ],
};

export default function Home() {
  const examplesQuery = trpc.examples.list.useQuery(undefined, { retry: 1 });
  const examples =
    examplesQuery.data && examplesQuery.data.length > 0
      ? examplesQuery.data.map((ex) => ({
          title: ex.title,
          subtitle: ex.subtitle,
          photos: ex.photos.map((p) => ({
            src: examplePhotoUrl(p.id),
            caption: p.caption,
          })),
        }))
      : [DEMO_EXAMPLE];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <Badge variant="secondary" className="mb-6">
            Human-managed AI try-on for furniture retailers
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Increase sofa sale conversion by{" "}
            <span className="text-primary">40%</span> and cut returns by{" "}
            <span className="text-primary">55%</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
            with photorealistic, scale-accurate in-room previews — managed by
            humans, delivered in under 30 minutes, from $9 per scene. Many
            photos from different angles during one fitting.
          </p>
          <p className="mt-4 text-base font-medium">
            Great for closing deals with high-intent buyers!
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/new-task">
                <Plus className="mr-1 h-5 w-5" /> New task
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#examples">
                See examples <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          What every fitting includes
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          A premium preview service designed for sofa shoppers who are ready to
          buy — and need one final nudge.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <Card key={b.title} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="border-y bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Example fittings
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Every fitting is a full photo story: the room, the color, the sofa —
            and the final in-room previews.
          </p>

          <div className="mt-10 space-y-12">
            {examples.map((ex) => (
              <div key={ex.title}>
                <h3 className="text-xl font-semibold">{ex.title}</h3>
                {ex.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{ex.subtitle}</p>
                )}
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ex.photos.map((p) => (
                    <figure key={p.src} className="overflow-hidden rounded-xl border bg-background">
                      <img
                        src={p.src}
                        alt={p.caption ?? ex.title}
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                      {p.caption && (
                        <figcaption className="px-3 py-2 text-sm text-muted-foreground">
                          {p.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Loved by furniture sellers
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <Card key={r.name}>
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed">“{r.text}”</p>
                <div className="mt-4 border-t pt-4">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Ready to close more high-intent buyers?
          </h2>
          <p className="mx-auto mt-2 max-w-xl opacity-90">
            Send us a room photo and a sofa photo — get a full preview set in
            15–30 minutes, from $9 per scene.
          </p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link to="/new-task">
              <Plus className="mr-1 h-5 w-5" /> New task
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} SofaFit Studio. Photorealistic sofa try-ons.</p>
          <Link to="/admin" className="hover:text-foreground">Studio admin</Link>
        </div>
      </footer>
    </div>
  );
}
